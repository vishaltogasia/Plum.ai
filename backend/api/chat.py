import uuid
import json
import time
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models import models
from backend.schemas import schemas
from backend.ai.rag import execute_rag_pipeline_stream
from typing import List
import logging

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger("plum.ai.chat")

@router.post("/sessions", response_model=schemas.ChatSessionOut, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    business_id: int = Query(...),
    session_in: schemas.ChatSessionCreate = None,
    db: Session = Depends(get_db)
):
    """Start a new chat session for a customer visiting the business's widget/public link."""
    # Verify business exists
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found."
        )
        
    session_id = str(uuid.uuid4())
    customer_name = session_in.customer_name if session_in else "Visitor"
    customer_email = session_in.customer_email if session_in else None
    
    db_session = models.ChatSession(
        id=session_id,
        business_id=business_id,
        customer_name=customer_name,
        customer_email=customer_email
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/sessions/{session_id}/messages", response_model=List[schemas.MessageOut])
def list_session_messages(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve chat history for a specific chat session."""
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )
    return db.query(models.Message).filter(models.Message.session_id == session_id).order_by(models.Message.created_at.asc()).all()

@router.post("/sessions/{session_id}/stream")
async def stream_chat_response(
    session_id: str,
    message_in: schemas.MessageCreate,
    db: Session = Depends(get_db)
):
    """Stream AI responses in real-time using Server-Sent Events (SSE) and log conversation history."""
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )
        
    business_id = session.business_id
    query = message_in.content
    
    # Fetch chat history for context injection
    db_messages = db.query(models.Message).filter(models.Message.session_id == session_id).all()
    history = [{"sender": m.sender, "content": m.content} for m in db_messages]
    
    # Save the user query to db
    user_msg = models.Message(
        session_id=session_id,
        sender="user",
        content=query
    )
    db.add(user_msg)
    db.commit()
    
    # Capture start time to compute response time analytics
    start_time = time.time()

    def event_generator():
        nonlocal start_time
        full_text = ""
        citations = []
        
        try:
            # Call prompt/RAG executor
            generator = execute_rag_pipeline_stream(
                db=db,
                business_id=business_id,
                session_id=session_id,
                query=query,
                history=history
            )
            
            for chunk in generator:
                if chunk.startswith("data:"):
                    try:
                        clean_data = chunk.replace("data:", "").strip()
                        if clean_data:
                            data_dict = json.loads(clean_data)
                            if "text" in data_dict:
                                full_text += data_dict["text"]
                            if "citations" in data_dict:
                                citations = data_dict["citations"]
                    except Exception:
                        pass
                yield chunk
                
            # Compute total response time
            response_time = time.time() - start_time
            
            # Save the bot response message with citations
            bot_msg = models.Message(
                session_id=session_id,
                sender="bot",
                content=full_text,
                citations=citations
            )
            db.add(bot_msg)
            
            # Log analytics entry
            analytics_entry = models.Analytics(
                business_id=business_id,
                session_id=session_id,
                response_time_seconds=response_time
            )
            db.add(analytics_entry)
            
            db.commit()
            logger.info(f"Bot response saved for session {session_id}. Response time: {response_time:.2f}s")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error in RAG stream session: {str(e)}")
            yield f"data: {json.dumps({'error': 'Server generation error occurred.'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
