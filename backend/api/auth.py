from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models import models
from backend.schemas import schemas
from backend.auth import hash as auth_hash
from backend.auth import jwt as auth_jwt

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
def refresh_token(token_in: schemas.Token, db: Session = Depends(get_db)):
    """Validate refresh token and issue a new access token."""
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
        
    # Issue new access token
    access_token = auth_jwt.create_access_token({"user_id": user.id, "email": user.email})
    
    # We can also return the same refresh token, or generate a new one
    return schemas.Token(access_token=access_token, refresh_token=token_in.refresh_token)
