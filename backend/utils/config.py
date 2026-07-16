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

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
