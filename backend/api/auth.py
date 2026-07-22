from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models import models
from backend.schemas import schemas
from backend.auth import hash as auth_hash
from backend.auth import jwt as auth_jwt
from backend.middleware.auth import get_current_user
from backend.schemas.schemas import RefreshTokenRequest

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user and generate access/refresh tokens."""
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
        
    # Create new user
    db_user = models.User(
        email=user_in.email,
        hashed_password=auth_hash.hash_password(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
        is_superuser=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Generate tokens
    access_token = auth_jwt.create_access_token({"user_id": db_user.id, "email": db_user.email})
    refresh_token = auth_jwt.create_refresh_token({"user_id": db_user.id, "email": db_user.email})
    
    return schemas.Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/login", response_model=schemas.Token)
def login(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate user credentials and issue tokens."""
    user = db.query(models.User).filter(models.User.email == login_in.email).first()
    if not user or not auth_hash.verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password."
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive."
        )
        
    # Generate tokens
    access_token = auth_jwt.create_access_token({"user_id": user.id, "email": user.email})
    refresh_token = auth_jwt.create_refresh_token({"user_id": user.id, "email": user.email})
    
    return schemas.Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(token_in: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Validate refresh token and issue a new access/refresh token pair."""
    payload = auth_jwt.decode_token(token_in.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token."
        )
        
    user_id = payload.get("user_id")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )
        
    # Issue new token pair
    access_token = auth_jwt.create_access_token({"user_id": user.id, "email": user.email})
    new_refresh_token = auth_jwt.create_refresh_token({"user_id": user.id, "email": user.email})
    
    return schemas.Token(access_token=access_token, refresh_token=new_refresh_token)

@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    profile_update: schemas.UserProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information (name)."""
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    # Update fields
    if profile_update.full_name:
        user.full_name = profile_update.full_name
    
    db.commit()
    db.refresh(user)
    return schemas.UserOut.model_validate(user)

@router.post("/change-password")
def change_password(
    password_change: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password."""
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    # Verify current password
    if not auth_hash.verify_password(password_change.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect."
        )
    
    # Validate new password
    if len(password_change.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )
    
    # Update password
    user.hashed_password = auth_hash.hash_password(password_change.new_password)
    db.commit()
    db.refresh(user)
    
    return {"message": "Password changed successfully."}

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user)
):
    """Return currently authenticated user's profile information."""
    return schemas.UserOut.model_validate(current_user)
