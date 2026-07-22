import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, JSON, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    businesses = relationship("Business", back_populates="owner", cascade="all, delete-orphan")

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Configuration metadata
    working_hours = Column(JSON, nullable=True)  # Format: {"monday": {"open": "09:00", "close": "17:00"}, ...}
    social_links = Column(JSON, nullable=True)   # Format: {"facebook": "url", "twitter": "url", ...}
    contact_phone = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    system_prompt = Column(Text, nullable=True)  # Custom instructions for the AI agent

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="businesses")
    documents = relationship("Document", back_populates="business", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="business", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="business", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="business", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx, txt, csv, url
    file_path = Column(String, nullable=True)
    content_text = Column(Text, nullable=True)
    char_count = Column(Integer, default=0)
    status = Column(String, default="processing")  # processing, completed, error
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    business = relationship("Business", back_populates="documents")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True)  # UUID string
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    customer_name = Column(String, default="Visitor")
    customer_email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    business = relationship("Business", back_populates="chat_sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="session", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String, nullable=False)  # user (visitor), bot, owner
    content = Column(Text, nullable=False)
    citations = Column(JSON, nullable=True)  # List of dicts: [{"id": 1, "filename": "doc.pdf", "chunk": "text..."}]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="SET NULL"), nullable=True)
    customer_email = Column(String, nullable=False)
    issue_description = Column(Text, nullable=False)
    status = Column(String, default="open")  # open, resolved, closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    business = relationship("Business", back_populates="tickets")
    session = relationship("ChatSession", back_populates="tickets")

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    response_time_seconds = Column(Float, default=0.0)
    customer_satisfaction = Column(Integer, nullable=True)  # 1 to 5 rating
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    business = relationship("Business", back_populates="analytics")
    session = relationship("ChatSession", back_populates="analytics")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, unique=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    business = relationship("Business")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, default="member")  # admin, moderator, member
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Unique constraint: one user can only be a member of a team once
    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_member"),
    )

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User")
