import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models import models
from backend.schemas import schemas
from backend.middleware.auth import get_current_user
from backend.ai.vector_store import vector_store
from backend.services.storage import storage_service
from typing import List

router = APIRouter(prefix="/businesses", tags=["businesses"])

# Create base folder for uploads if it doesn't exist
UPLOAD_DIR = "static/logos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=schemas.BusinessOut, status_code=status.HTTP_201_CREATED)
def create_business(
    business_in: schemas.BusinessCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new business workspace associated with the logged-in user."""
    db_business = models.Business(
        **business_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    return db_business

@router.get("", response_model=List[schemas.BusinessOut])
def list_businesses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all businesses owned by the current user."""
    return db.query(models.Business).filter(models.Business.owner_id == current_user.id).all()

@router.get("/{business_id}", response_model=schemas.BusinessOut)
def get_business(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retrieve details of a specific business workspace."""
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business workspace not found or unauthorized access."
        )
    return business

@router.put("/{business_id}", response_model=schemas.BusinessOut)
def update_business(
    business_id: int,
    business_in: schemas.BusinessUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update configurations and profile settings of a business workspace."""
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business workspace not found or unauthorized access."
        )
        
    update_data = business_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(business, field, value)
        
    db.commit()
    db.refresh(business)
    return business

@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a business workspace and all its associated documents, chat history, vectors, and stored files."""
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business workspace not found or unauthorized access."
        )

    # Clean up stored files in MinIO for each document
    documents = db.query(models.Document).filter(
        models.Document.business_id == business_id
    ).all()
    for doc in documents:
        if doc.file_path:
            storage_service.delete_file(doc.file_path)

    # Delete the entire ChromaDB vector collection for this business tenant
    vector_store.delete_business_collection(business_id)

    # Cascade-delete DB record (also removes documents, sessions, tickets via DB cascade)
    db.delete(business)
    db.commit()
    return None

@router.post("/{business_id}/logo", response_model=schemas.BusinessOut)
async def upload_logo(
    business_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload and set business logo image."""
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
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "png"
    if file_ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP."
        )
        
    # Save logo file
    filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    # Update logo URL in database
    business.logo_url = f"/static/logos/{filename}"
    db.commit()
    db.refresh(business)
    return business
