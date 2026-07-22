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

    # AI Stack / LLM
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", env="OLLAMA_BASE_URL")
    LLM_MODEL: str = Field(default="llama3.2", env="LLM_MODEL")
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    
    # Fallback/External AI API (if Ollama is not configured/offline)
    # Using Gemini or OpenAI if keys are provided
    GEMINI_API_KEY: str | None = Field(default=None, env="GEMINI_API_KEY")
    OPENAI_API_KEY: str | None = Field(default=None, env="OPENAI_API_KEY")

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
