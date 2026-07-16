from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.utils.config import settings

# Determine if we are using SQLite
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Configure database engine
connect_args = {"check_same_thread": False} if is_sqlite else {}
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
