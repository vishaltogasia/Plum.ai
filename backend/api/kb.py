from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models import models
from backend.schemas import schemas
from backend.middleware.auth import get_current_user
from backend.services import parser, chunker
from backend.services.scraper import url_scraper
from backend.services.storage import storage_service
from backend.ai.vector_store import vector_store
from typing import List, Optional
import logging

router = APIRouter(prefix="/businesses/{business_id}/kb", tags=["knowledge-base"])
logger = logging.getLogger("plum.ai.kb")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB hard cap

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "csv"}

CONTENT_TYPE_MAP = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
    "csv": "text/csv",
}

# ---------------------------------------------------------------------------
# Background Tasks
# ---------------------------------------------------------------------------

def process_document_ingestion_task(
    business_id: int,
    document_id: int,
    file_bytes: bytes,
    filename: str,
    file_type: str,
    db_session: Session
):
    """Background task to extract text, chunk it, generate embeddings and store in ChromaDB.
    
    The original file is stored in MinIO for audit/download.
    Text extraction + vector indexing runs against the in-memory bytes.
    """
    db = db_session
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        logger.error(f"Ingestion failed: Document ID {document_id} not found in database.")
        return
        
    try:
        # Step 1: Upload original file to MinIO (non-fatal if it fails)
        object_key = storage_service.build_object_key(business_id, document_id, filename)
        stored_key = storage_service.upload_file(
            file_bytes=file_bytes,
            object_key=object_key,
            content_type=CONTENT_TYPE_MAP.get(file_type, "application/octet-stream"),
        )
        if stored_key:
            document.file_path = stored_key
            db.commit()

        # Step 2: Extract Text from in-memory bytes
        logger.info(f"Starting text extraction for document {document_id} ({filename})")
        extracted_text = parser.extract_text_from_bytes(file_bytes, file_type)
        char_count = len(extracted_text)
        
        if char_count == 0:
            raise ValueError("No readable text could be extracted from this document.")
            
        # Step 3: Split text into chunks
        chunks = chunker.split_text(extracted_text)
        
        # Step 4: Insert chunks into Vector database (ChromaDB)
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
        logger.info(f"Scraping URL: {url}")
        
        # Scrape the URL
        result = url_scraper.scrape_url(url)
        if not result:
            raise ValueError(f"Failed to scrape content from {url}")
        
        page_title, extracted_text = result
        char_count = len(extracted_text)
        
        # Chunk the extracted text
        chunks = chunker.split_text(extracted_text)
        
        # Add to vector store
        vector_store.add_document_chunks(
            business_id=business_id,
            document_id=document_id,
            filename=page_title or url,
            chunks=chunks
        )
        
        # Update document record
        document.status = "completed"
        document.content_text = extracted_text
        document.char_count = char_count
        db.commit()
        logger.info(f"Scraping and ingestion successful for URL: {url} ({char_count} chars)")
    except Exception as e:
        logger.error(f"URL Ingestion failed for {url}: {str(e)}")
        document.status = "error"
        if hasattr(document, 'error_message'):
            document.error_message = str(e)
        db.commit()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/upload", response_model=schemas.DocumentOut, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    business_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload a file (PDF, DOCX, TXT, CSV) to the business's knowledge base.
    
    Files are stored persistently in MinIO object storage and indexed in ChromaDB.
    Maximum upload size: 50 MB.
    """
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
        
    # Validate file extension
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported: {', '.join(t.upper() for t in ALLOWED_EXTENSIONS)}"
        )

    # Read file content bytes
    file_bytes = await file.read()

    # Enforce 50 MB size limit
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {MAX_UPLOAD_BYTES // (1024*1024)} MB."
        )
    
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
    
    # Queue RAG indexing + MinIO upload task to execute in the background
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


@router.get("/documents/{document_id}/download")
def get_document_download_url(
    business_id: int,
    document_id: int,
    expires_in: int = 3600,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate a presigned download URL for a stored document.
    
    The URL is valid for `expires_in` seconds (default: 1 hour).
    Only available for file uploads (not URL-scraped documents).
    """
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

    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.business_id == business_id
    ).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    if document.file_type == "url":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL-sourced documents do not have a stored file to download."
        )

    if not document.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No stored file found for this document (may still be processing)."
        )

    presigned_url = storage_service.get_presigned_url(
        object_key=document.file_path,
        expires_in=min(expires_in, 86400),  # cap at 24 hours
    )
    if not presigned_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not generate download URL. Storage service may be unavailable."
        )

    return JSONResponse({
        "document_id": document_id,
        "filename": document.filename,
        "download_url": presigned_url,
        "expires_in_seconds": min(expires_in, 86400),
    })


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    business_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a document from the business's knowledge base.
    
    Removes vectors from ChromaDB and the original file from MinIO object storage.
    """
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

    # Delete stored file from MinIO (if it exists)
    if document.file_path:
        storage_service.delete_file(document.file_path)
        
    # Delete from ChromaDB
    vector_store.delete_document_vectors(business_id=business_id, document_id=document_id)
    
    # Delete from Database
    db.delete(document)
    db.commit()
    return None


@router.get("/storage/health")
def storage_health(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Check MinIO storage service connectivity and bucket status."""
    return storage_service.health_check()
