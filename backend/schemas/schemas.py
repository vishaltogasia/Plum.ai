from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ==========================================
# User Schemas
# ==========================================
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# ==========================================
# Token Schemas
# ==========================================
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# ==========================================
# Business Schemas
# ==========================================
class BusinessBase(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    working_hours: Optional[Dict[str, Any]] = None
    social_links: Optional[Dict[str, Any]] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    system_prompt: Optional[str] = None

class BusinessCreate(BusinessBase):
    pass

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    working_hours: Optional[Dict[str, Any]] = None
    social_links: Optional[Dict[str, Any]] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    system_prompt: Optional[str] = None

class BusinessOut(BusinessBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# Document Schemas
# ==========================================
class DocumentOut(BaseModel):
    id: int
    business_id: int
    filename: str
    file_type: str
    char_count: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# Message Schemas
# ==========================================
class MessageCreate(BaseModel):
    content: str

class MessageOut(BaseModel):
    id: int
    session_id: str
    sender: str
    content: str
    citations: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# Chat Session Schemas
# ==========================================
class ChatSessionCreate(BaseModel):
    customer_name: Optional[str] = "Visitor"
    customer_email: Optional[EmailStr] = None

class ChatSessionOut(BaseModel):
    id: str
    business_id: int
    customer_name: str
    customer_email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# Ticket Schemas
# ==========================================
class TicketCreate(BaseModel):
    customer_email: EmailStr
    issue_description: str
    session_id: Optional[str] = None

class TicketUpdate(BaseModel):
    status: str  # open, resolved, closed

class TicketOut(BaseModel):
    id: int
    business_id: int
    session_id: Optional[str] = None
    customer_email: str
    issue_description: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# Analytics Schemas
# ==========================================
class AnalyticsOverview(BaseModel):
    total_chats: int
    daily_users: int
    avg_response_time: float
    satisfaction_rate: float
    knowledge_coverage: float

class AnalyticsTimelinePoint(BaseModel):
    date: str
    conversations: int
    avg_response_time: float

class AnalyticsTopQuestion(BaseModel):
    question: str
    frequency: int
    resolution_rate: float
    ai_confidence: float
