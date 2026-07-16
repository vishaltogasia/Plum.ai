import requests
import json
import logging
from typing import List, Dict, Any, Generator
from sqlalchemy.orm import Session
from backend.utils.config import settings
from backend.models import models
from backend.ai.vector_store import vector_store

logger = logging.getLogger("plum.ai.rag")

def check_ollama_status() -> bool:
    """Check if local Ollama server is running and responsive."""
    try:
        response = requests.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=2)
        return response.status_code == 200
    except Exception:
        return False

def generate_mock_stream(prompt: str, context: List[Dict[str, Any]]) -> Generator[str, None, None]:
    """Fallback generator to simulate streaming text responses when offline or models are loading."""
    logger.info("Generating response using mock/fallback stream.")
    
    # Synthesize a clean reply from the retrieved context if available
    if context:
        sources = ", ".join(list(set([c["metadata"]["filename"] for c in context])))
        intro = f"Based on our knowledge base (specifically from {sources}):\n\n"
        
        # Take snippets from context
        snippets = "\n".join([f"- {c['content'][:150]}..." for c in context[:2]])
        
        reply = intro + snippets + "\n\nIs there anything else I can clarify for you?"
    else:
        reply = "Hello! I am the AI assistant. I couldn't find any documents in my knowledge base yet to answer your query. Please ask the administrator to upload relevant documents, or ask me another question!"
        
    # Yield word by word to simulate streaming
    for word in reply.split(" "):
        yield f" {word}"
        import time
        time.sleep(0.04)

def execute_gemini_stream(prompt: str, system_instruction: str) -> Generator[str, None, None]:
    """Stream from Google Gemini API if key is available."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_instruction}]}
        }
        response = requests.post(url, json=payload, stream=True, timeout=15)
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                decoded = line.decode("utf-8").strip()
                if decoded.startswith("data:") or decoded.startswith("[") or decoded.startswith(","):
                    # Strip leading data: or outer list brackets
                    continue
                try:
                    # Clean up leading comma or brackets if present in raw chunks
                    clean_line = decoded.lstrip(",").strip()
                    if not clean_line or clean_line == "]" or clean_line == "[":
                        continue
                    chunk_json = json.loads(clean_line)
                    text_chunk = chunk_json["candidates"][0]["content"]["parts"][0]["text"]
                    yield text_chunk
                except Exception:
                    pass
    except Exception as e:
        logger.error(f"Gemini API streaming failed: {str(e)}")
        yield "\n[System Error: Gemini model failed. Falling back to local responder...]\n"
        for chunk in generate_mock_stream(prompt, []):
            yield chunk

def execute_rag_pipeline_stream(
    db: Session,
    business_id: int,
    session_id: str,
    query: str,
    history: List[Dict[str, Any]] = None
) -> Generator[str, None, None]:
    """
    RAG Pipeline Core:
    1. Retrieve relevant contexts from ChromaDB collection.
    2. Assess search confidence/distance.
    3. Format prompt template injecting system settings, context chunks, and history.
    4. Stream LLM text response.
    5. Detect low confidence -> Auto-create human handoff Ticket.
    6. Yield SSE chunks containing text stream and final citations metadata.
    """
    # Step 1: Retrieve contexts
    logger.info(f"RAG search query for business {business_id}: '{query}'")
    contexts = vector_store.search_similar_chunks(business_id=business_id, query=query, limit=4)
    
    # Assess if we have enough confidence (e.g. at least one chunk with similarity distance < 1.35)
    has_relevant_info = len(contexts) > 0
    lowest_distance = min([c["distance"] for c in contexts]) if contexts else 99.0
    
    # Threshold for low confidence (e.g. Chroma distance > 1.3 means low semantic match)
    is_low_confidence = not has_relevant_info or lowest_distance > 1.3

    # Fetch business configuration
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    system_prompt = business.system_prompt if business and business.system_prompt else "You are a helpful customer support assistant."
    
    # Format contexts
    context_str = ""
    citations = []
    for idx, c in enumerate(contexts):
        doc_id = c["metadata"].get("document_id")
        filename = c["metadata"].get("filename", "Unknown Document")
        context_str += f"\n--- Source: {filename} ---\n{c['content']}\n"
        citations.append({
            "id": doc_id,
            "filename": filename,
            "content": c["content"]
        })
        
    # Format prompt templates
    history_str = ""
    if history:
        for msg in history[-5:]:  # Include last 5 messages for memory
            sender_name = "Customer" if msg["sender"] == "user" else "Assistant"
            history_str += f"{sender_name}: {msg['content']}\n"
            
    full_prompt = f"""System Prompt: {system_prompt}

You have access to the following documents from our knowledge base:
{context_str if context_str else "No documents uploaded. Answer general questions politely but note that specific business details are unavailable."}

Conversation History:
{history_str}
Customer: {query}
Assistant:"""

    logger.info(f"Lowest vector distance: {lowest_distance:.4f}. Low confidence flag: {is_low_confidence}")

    # Step 2: Stream from model
    full_response = ""
    ollama_running = check_ollama_status()
    
    try:
        if ollama_running:
            logger.info(f"Ollama server detected. Using model: {settings.LLM_MODEL}")
            # Format payload for Ollama
            url = f"{settings.OLLAMA_BASE_URL}/api/chat"
            messages = [
                {"role": "system", "content": system_prompt + f"\nUse these knowledge documents for references:\n{context_str}"},
            ]
            if history:
                for h in history[-5:]:
                    messages.append({"role": "user" if h["sender"] == "user" else "assistant", "content": h["content"]})
            messages.append({"role": "user", "content": query})
            
            payload = {
                "model": settings.LLM_MODEL,
                "messages": messages,
                "stream": True,
                "options": {
                    "temperature": 0.3
                }
            }
            
            response = requests.post(url, json=payload, stream=True, timeout=10)
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    chunk_json = json.loads(line.decode("utf-8"))
                    text_chunk = chunk_json.get("message", {}).get("content", "")
                    full_response += text_chunk
                    # SSE format: data: {"text": "..."}
                    yield f"data: {json.dumps({'text': text_chunk})}\n\n"
                    
        elif settings.GEMINI_API_KEY:
            logger.info("Using Google Gemini API.")
            # Stream from Gemini
            for text_chunk in execute_gemini_stream(query, system_prompt + f"\nKnowledge base documents:\n{context_str}"):
                full_response += text_chunk
                yield f"data: {json.dumps({'text': text_chunk})}\n\n"
                
        else:
            logger.info("Ollama offline and no API keys. Falling back to mock generator.")
            # Mock generator fallback
            for text_chunk in generate_mock_stream(query, contexts):
                full_response += text_chunk
                yield f"data: {json.dumps({'text': text_chunk})}\n\n"
                
    except Exception as e:
        logger.error(f"Error in streaming pipeline: {str(e)}")
        # Ultimate fallback
        yield f"data: {json.dumps({'text': ' [Streaming connection lost. Reconnecting... ] '})}\n\n"
        for text_chunk in generate_mock_stream(query, contexts):
            full_response += text_chunk
            yield f"data: {json.dumps({'text': text_chunk})}\n\n"

    # Step 3: Trigger Human Handoff Ticket if confidence is low
    # Or if the AI response specifically mentions it cannot answer
    negative_indicators = ["don't know", "cannot help", "do not have that information", "no info", "apologize", "sorry"]
    response_lower = full_response.lower()
    
    contains_negatives = any(ind in response_lower for ind in negative_indicators)
    
    if is_low_confidence or (contains_negatives and not context_str):
        logger.info(f"Triggering human handoff ticket creation for session {session_id}.")
        # Search for session customer details
        session_record = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
        customer_email = session_record.customer_email if session_record and session_record.customer_email else "visitor@example.com"
        
        # Check if ticket already exists for this session to avoid duplicates
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
            
            # Send dynamic notifications payload inside stream
            hand_off_msg = "\n\n*[A support ticket has been opened automatically. A customer representative has been notified and will review your query shortly.]*"
            yield f"data: {json.dumps({'text': hand_off_msg})}\n\n"
            
    # Yield citations as final packet
    yield f"data: {json.dumps({'citations': citations})}\n\n"
    yield "event: end\ndata: close\n\n"
