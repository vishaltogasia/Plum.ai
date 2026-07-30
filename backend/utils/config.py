import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Plum.ai Backend"
    API_V1_STR: str = "/api"
    
    # Security & JWT
    SECRET_KEY: str = Field(default="supersecretkeyforplumaisupportplatformchangeinprod", env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    # Default to local sqlite for ease of development; easily overridable via env
    DATABASE_URL: str = Field(default="sqlite:///./plum.db", env="DATABASE_URL")

    # Vector Storage
    CHROMA_PERSIST_DIRECTORY: str = Field(default="./chroma_db", env="CHROMA_PERSIST_DIRECTORY")

    # AI Stack / LLM — OpenRouter
    OPENROUTER_API_KEY: str | None = Field(default=None, env="OPENROUTER_API_KEY")
    OPENROUTER_MODEL: str = Field(default="google/gemma-4-31b-it:free", env="OPENROUTER_MODEL")
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    # LLM Request Tuning
    REQUEST_TIMEOUT: int = 30
    MAX_OUTPUT_TOKENS: int = 800
    TEMPERATURE: float = 0.0
    SIMILARITY_THRESHOLD: float = 1.3  # ChromaDB distance above this = low confidence
    TOP_K: int = 5  # Number of chunks to retrieve from ChromaDB
    MAX_HISTORY_TOKENS: int = 1500  # Token budget for conversation history

    # Email Configuration
    SMTP_SERVER: str = Field(default="smtp.gmail.com", env="SMTP_SERVER")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: str | None = Field(default=None, env="SMTP_USER")
    SMTP_PASSWORD: str | None = Field(default=None, env="SMTP_PASSWORD")
    FRONTEND_URL: str = Field(default="http://localhost:5173", env="FRONTEND_URL")

    # MinIO / S3-compatible Object Storage
    MINIO_ENDPOINT: str = Field(default="minio:9000", env="MINIO_ENDPOINT")
    MINIO_ACCESS_KEY: str = Field(default="plum_minio_admin", env="MINIO_ACCESS_KEY")
    MINIO_SECRET_KEY: str = Field(default="plum_minio_secret", env="MINIO_SECRET_KEY")
    MINIO_BUCKET_NAME: str = Field(default="plum-documents", env="MINIO_BUCKET_NAME")
    MINIO_USE_SSL: bool = Field(default=False, env="MINIO_USE_SSL")
    # Public-facing URL for presigned URLs (browser-accessible, differs from internal Docker host)
    MINIO_PUBLIC_URL: str = Field(default="http://localhost:9000", env="MINIO_PUBLIC_URL")

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
