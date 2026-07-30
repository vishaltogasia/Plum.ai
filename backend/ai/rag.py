import json
import time
import logging
from typing import List, Dict, Any, Generator
from sqlalchemy.orm import Session
from backend.utils.config import settings
from backend.models import models
from backend.ai.vector_store import vector_store
from backend.services.email import email_service
from backend.ai.llm.openrouter import openrouter_provider
from backend import prompts

logger = logging.getLogger("plum.ai.rag")


# ---------------------------------------------------------------------------
# Helper: Token estimation & history trimming
# ---------------------------------------------------------------------------
def estimate_tokens(text: str) -> int:
    """Estimate token count for a text string (~4 characters per token)."""
    if not text:
        return 0
    return max(1, len(text) // 4)


def trim_history_by_tokens(
    history: List[Dict[str, Any]],
    max_history_tokens: int = 1500
) -> List[Dict[str, Any]]:
    """
    Trim conversation history working backwards from most recent message
    until token budget is reached.
    """
    if not history:
        return []

    budget = max_history_tokens
    trimmed = []

    for msg in reversed(history):
        content = msg.get("content", "")
        tokens = estimate_tokens(content)
        if budget - tokens < 0 and trimmed:
            break
        trimmed.append(msg)
        budget -= tokens

    return list(reversed(trimmed))


# ---------------------------------------------------------------------------
# Helper: Citation & Confidence calculation
# ---------------------------------------------------------------------------
def _format_citation(metadata: Dict[str, Any], content: str, distance: float) -> Dict[str, Any]:
    """Build a rich citation object with chunk_id, page number, distance, and content."""
    return {
        "id": metadata.get("document_id"),
        "chunk_id": metadata.get("chunk_id"),
        "filename": metadata.get("filename", "Unknown Document"),
        "page": metadata.get("page_number"),
        "chunk_index": metadata.get("chunk_index"),
        "distance": round(float(distance), 4),
        "content": content,
    }


def calculate_confidence_score(lowest_distance: float, threshold: float) -> float:
    """
    Calculate a normalized confidence score (0.0 to 1.0) based on ChromaDB distance.
    Smaller distance = higher confidence.
    """
    if lowest_distance >= 99.0:
        return 0.0
    # Normalize score against max distance limit (~2.0 for L2 distance)
    score = max(0.0, min(1.0, 1.0 - (lowest_distance / 2.0)))
    return round(score, 2)


# ---------------------------------------------------------------------------
# Fallback Stream
# ---------------------------------------------------------------------------
def generate_mock_stream(prompt: str, context: List[Dict[str, Any]]) -> Generator[str, None, None]:
    """Fallback generator to simulate streaming text responses when the API is unreachable."""
    logger.info("Generating response using mock/fallback stream.")

    if context:
        sources = ", ".join(list(set([c["metadata"]["filename"] for c in context])))
        intro = f"Based on our knowledge base (specifically from {sources}):\n\n"
        snippets = "\n".join([f"- {c['content'][:150]}..." for c in context[:2]])
        reply = intro + snippets + "\n\nIs there anything else I can clarify for you?"
    else:
        reply = ("Hello! I am the AI assistant. I couldn't find any documents in my "
                 "knowledge base yet to answer your query. Please ask the administrator "
                 "to upload relevant documents, or ask me another question!")

    for word in reply.split(" "):
        yield f" {word}"
        time.sleep(0.04)


# ---------------------------------------------------------------------------
# Health Check Endpoint Helper
# ---------------------------------------------------------------------------
def check_llm_health() -> Dict[str, Any]:
    """Check connectivity and reachability of the underlying LLM provider."""
    return openrouter_provider.health_check()


# ---------------------------------------------------------------------------
# RAG Pipeline Core
# ---------------------------------------------------------------------------
def execute_rag_pipeline_stream(
    db: Session,
    business_id: int,
    session_id: str,
    query: str,
    history: List[Dict[str, Any]] = None
) -> Generator[str, None, None]:
    """
    RAG Pipeline Core:
    1. Retrieve relevant contexts from ChromaDB collection (using settings.TOP_K).
    2. Log retrieval details (Query, retrieved chunks, chunk_id, page, distances).
    3. Check similarity threshold — skip LLM if no relevant chunks.
    4. Trim conversation history by token budget.
    5. Stream LLM text response using LLM provider abstraction (OpenRouter).
    6. Track latency & token usage.
    7. Detect low confidence -> Auto-create human handoff Ticket.
    8. Yield SSE chunks containing text stream, confidence score, token usage, and final citations.
    """
    start_time = time.time()

    # Step 1: Retrieve contexts using settings.TOP_K
    logger.info(f"--- RAG Execution Started ---")
    logger.info(f"User Query [Business #{business_id}, Session #{session_id}]: '{query}'")

    contexts = vector_store.search_similar_chunks(
        business_id=business_id,
        query=query,
        limit=settings.TOP_K
    )

    # Retrieval Logging
    logger.info(f"Retrieved {len(contexts)} chunks (TOP_K={settings.TOP_K}):")
    for idx, c in enumerate(contexts):
        meta = c["metadata"]
        logger.info(
            f"  [{idx+1}] File: {meta.get('filename')} | Page: {meta.get('page_number')} | "
            f"ChunkID: {meta.get('chunk_id')} | Distance: {c['distance']:.4f}"
        )

    # Assess confidence & distance
    has_relevant_info = len(contexts) > 0
    lowest_distance = min([c["distance"] for c in contexts]) if contexts else 99.0
    is_low_confidence = not has_relevant_info or lowest_distance > settings.SIMILARITY_THRESHOLD
    confidence_score = calculate_confidence_score(lowest_distance, settings.SIMILARITY_THRESHOLD)

    logger.info(f"Lowest distance: {lowest_distance:.4f} | Threshold: {settings.SIMILARITY_THRESHOLD} | "
                f"Confidence Score: {confidence_score} | Low Confidence Flag: {is_low_confidence}")

    # Fetch business configuration
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    business_instructions = (business.system_prompt if business and business.system_prompt
                             else "You are a helpful customer support assistant.")

    # Build context string and citations
    context_str = ""
    citations = []
    for c in contexts:
        filename = c["metadata"].get("filename", "Unknown Document")
        page_num = c["metadata"].get("page_number")
        chunk_id = c["metadata"].get("chunk_id", "")
        page_label = f", Page {page_num}" if page_num else ""
        chunk_label = f" (ID: {chunk_id})" if chunk_id else ""
        context_str += f"\n--- Source: {filename}{page_label}{chunk_label} ---\n{c['content']}\n"
        citations.append(_format_citation(c["metadata"], c["content"], c["distance"]))

    # Step 2: Similarity threshold check — skip LLM if no relevant info
    if is_low_confidence or not contexts:
        no_info_msg = prompts.NO_RELEVANT_INFO_RESPONSE
        full_response = no_info_msg
        yield f"data: {json.dumps({'text': no_info_msg})}\n\n"
        logger.info("Chunks below similarity threshold or empty. Skipping LLM call.")

    else:
        # Step 3: Stream from LLM Provider
        full_response = ""

        # Build prompt & messages
        system_content = prompts.ANSWER_PROMPT_TEMPLATE.format(
            system_prompt=prompts.SYSTEM_PROMPT,
            business_instructions=business_instructions,
            context=context_str,
        )
        messages = [{"role": "system", "content": system_content}]

        # Trim history by token budget
        trimmed_history = trim_history_by_tokens(
            history or [],
            max_history_tokens=settings.MAX_HISTORY_TOKENS
        )
        logger.info(f"History trimmed from {len(history or [])} to {len(trimmed_history)} messages "
                    f"(Budget: {settings.MAX_HISTORY_TOKENS} tokens)")

        for h in trimmed_history:
            role = "user" if h["sender"] == "user" else "assistant"
            messages.append({"role": role, "content": h["content"]})

        messages.append({"role": "user", "content": query})

        logger.info(f"Selected LLM Provider: {openrouter_provider.provider_name} | "
                    f"Model: {openrouter_provider.model_name}")

        try:
            if settings.OPENROUTER_API_KEY:
                for text_chunk in openrouter_provider.stream(
                    messages=messages,
                    temperature=settings.TEMPERATURE,
                    max_tokens=settings.MAX_OUTPUT_TOKENS,
                ):
                    full_response += text_chunk
                    yield f"data: {json.dumps({'text': text_chunk})}\n\n"
            else:
                logger.info("No OpenRouter API key configured. Falling back to mock generator.")
                for text_chunk in generate_mock_stream(query, contexts):
                    full_response += text_chunk
                    yield f"data: {json.dumps({'text': text_chunk})}\n\n"

        except Exception as e:
            logger.error(f"Error in streaming pipeline: {str(e)}")
            yield f"data: {json.dumps({'text': ' [Streaming connection lost. Reconnecting... ] '})}\n\n"
            for text_chunk in generate_mock_stream(query, contexts):
                full_response += text_chunk
                yield f"data: {json.dumps({'text': text_chunk})}\n\n"

    # Capture Latency & Token Usage
    latency = round(time.time() - start_time, 2)
    token_usage = openrouter_provider.last_token_usage

    logger.info(f"--- RAG Execution Completed ---")
    logger.info(f"Model: {openrouter_provider.model_name} | Latency: {latency}s | "
                f"Tokens: Prompt={token_usage['prompt_tokens']}, "
                f"Completion={token_usage['completion_tokens']}, Total={token_usage['total_tokens']}")

    # Step 4: Trigger Human Handoff Ticket if confidence is low
    negative_indicators = [
        "don't know", "cannot help", "do not have that information",
        "no info", "apologize", "sorry", "couldn't find"
    ]
    response_lower = full_response.lower()
    contains_negatives = any(ind in response_lower for ind in negative_indicators)

    if is_low_confidence or (contains_negatives and not context_str):
        logger.info(f"Triggering human handoff ticket creation for session {session_id}.")
        session_record = db.query(models.ChatSession).filter(
            models.ChatSession.id == session_id
        ).first()
        customer_email = (session_record.customer_email
                         if session_record and session_record.customer_email
                         else "visitor@example.com")

        existing_ticket = db.query(models.Ticket).filter(
            models.Ticket.session_id == session_id,
            models.Ticket.status == "open"
        ).first()

        if not existing_ticket:
            ticket = models.Ticket(
                business_id=business_id,
                session_id=session_id,
                customer_email=customer_email,
                issue_description=f"AI Low Confidence Trigger. Customer queried: '{query}'",
                status="open"
            )
            db.add(ticket)
            db.commit()

            if customer_email != "visitor@example.com":
                business_name = business.name if business else "Our Support Team"
                customer_name = (session_record.customer_name
                                if session_record else "Valued Customer")
                email_service.send_ticket_notification(
                    customer_email=customer_email,
                    customer_name=customer_name,
                    ticket_id=ticket.id,
                    issue_description=f"Customer query: {query}",
                    business_name=business_name
                )

            hand_off_msg = ("\n\n*[A support ticket has been opened automatically. "
                           "A customer representative has been notified and will "
                           "review your query shortly.]*")
            yield f"data: {json.dumps({'text': hand_off_msg})}\n\n"

    # Step 5: Yield final metadata packet (citations, confidence, tokens, model, latency)
    metadata_packet = {
        "citations": citations,
        "confidence": confidence_score,
        "model": openrouter_provider.model_name,
        "latency_seconds": latency,
        "token_usage": token_usage,
    }
    yield f"data: {json.dumps(metadata_packet)}\n\n"
    yield "event: end\ndata: close\n\n"
