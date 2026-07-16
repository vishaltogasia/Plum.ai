from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models import models
from backend.schemas import schemas
from backend.middleware.auth import get_current_user
from backend.services import parser, chunker
from backend.ai.vector_store import vector_store
from typing import List
import logging

router = APIRouter(prefix="/businesses/{business_id}/kb", tags=["knowledge-base"])
logger = logging.getLogger("plum.ai.kb")

def process_document_ingestion_task(
    business_id: int,
    document_id: int,
    file_bytes: bytes,
    filename: str,
    file_type: str,
    db_session: Session
):
    """Background task to extract text, chunk it, generate embeddings and store in ChromaDB."""
    # Obtain document record from database
    db = db_session
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        logger.error(f"Ingestion failed: Document ID {document_id} not found in database.")
        return
        
    try:
        # Step 1: Extract Text
        logger.info(f"Starting text extraction for document {document_id} ({filename})")
        extracted_text = parser.extract_text_from_bytes(file_bytes, file_type)
        char_count = len(extracted_text)
        
        if char_count == 0:
            raise ValueError("No readable text could be extracted from this document.")
            
        # Step 2: Split text into chunks
        chunks = chunker.split_text(extracted_text)
        
        # Step 3: Insert chunks into Vector database (ChromaDB)
        vector_store.add_document_chunks(
            business_id=business_id,
            document_id=document_id,
            filename=filename,
            chunks=chunks
        )
        
        # Update Document state
        document.status = "completed"
        document.content_text = extracted_text
        document.char_count = char_count
        db.commit()
        logger.info(f"Ingestion successful for document {document_id}.")
        
    except Exception as e:
        logger.error(f"Ingestion error for document {document_id}: {str(e)}")
        document.status = "error"
        document.error_message = str(e)
        db.commit()

@router.post("/upload", response_model=schemas.DocumentOut, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    business_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload a file (PDF, DOCX, TXT, CSV) to the business's knowledge base."""
    # Verify business ownership
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business workspace not found or unauthorized access."
        )
        
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_ext not in ["pdf", "docx", "txt", "csv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Supported: PDF, DOCX, TXT, CSV"
        )
        
    # Read file content bytes
    file_bytes = await file.read()
    
    # Save base document placeholder in DB
    db_document = models.Document(
        business_id=business_id,
        filename=file.filename,
        file_type=file_ext,
        status="processing"
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Queue RAG indexing task to execute in the background
    background_tasks.add_task(
        process_document_ingestion_task,
        business_id=business_id,
        document_id=db_document.id,
        file_bytes=file_bytes,
        filename=file.filename,
        file_type=file_ext,
        db_session=db
    )
    
    return db_document

def process_url_ingestion_task(
    business_id: int,
    document_id: int,
    url: str,
    db_session: Session
):
    """Background task to scrape a URL, chunk it, and save in ChromaDB."""
    db = db_session
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        return
        
    try:
        logger.info(f"Crawling URL: {url}")
        extracted_text = parser.parse_url(url)
        char_count = len(extracted_text)
        
        chunks = chunker.split_text(extracted_text)
        
        vector_store.add_document_chunks(
            business_id=business_id,
            document_id=document_id,
            filename=url,
            chunks=chunks
        )
        
        document.status = "completed"
        document.content_text = extracted_text
        document.char_count = char_count
        db.commit()
        logger.info(f"Crawling and ingestion successful for URL: {url}")
    except Exception as e:
        logger.error(f"URL Ingestion failed: {str(e)}")
        document.status = "error"
        document.error_message = str(e)
        db.commit()

@router.post("/url", response_model=schemas.DocumentOut, status_code=status.HTTP_202_ACCEPTED)
def ingest_url(
    business_id: int,
    background_tasks: BackgroundTasks,
    url: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Crawl and ingest text contents from a webpage URL into the business knowledge base."""
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business workspace not found or unauthorized access."
        )
        
    if not url.startswith("http://") and not url.startswith("https://"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL format. Must start with http:// or https://"
        )
        
    # Save document placeholder in DB
    db_document = models.Document(
        business_id=business_id,
        filename=url,
        file_type="url",
        status="processing"
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Queue URL parsing in the background
    background_tasks.add_task(
        process_url_ingestion_task,
        business_id=business_id,
        document_id=db_document.id,
        url=url,
        db_session=db
    )
    
    return db_document

@router.get("/documents", response_model=List[schemas.DocumentOut])
def list_documents(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all documents ingested into a business's knowledge base."""
    # Verify business ownership
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business workspace not found or unauthorized access."
        )
        
    return db.query(models.Document).filter(models.Document.business_id == business_id).all()

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    business_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a document from the business's knowledge base and remove vectors from ChromaDB."""
    # Verify business ownership
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business workspace not found or unauthorized access."
        )
        
    # Find document
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.business_id == business_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
        
    # Delete from ChromaDB
    vector_store.delete_document_vectors(business_id=business_id, document_id=document_id)
    
    # Delete from Database
    db.delete(document)
    db.commit()
    return None
