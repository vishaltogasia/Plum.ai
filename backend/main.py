import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.utils.config import settings
from backend.database.session import engine, Base
from backend.api import auth, business, kb, chat, analytics

# Auto-create SQLite database tables on startup (production-ready fallback)
# In high production environments, migrations are handled by Alembic,
# but auto-creating tables here guarantees an immediate running environment out-of-the-box.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-tenant Customer Support AI SaaS Platform APIs",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist
os.makedirs("static/logos", exist_ok=True)
# Mount static files to serve uploaded images/logos
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register Api Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(business.router, prefix=settings.API_V1_STR)
app.include_router(kb.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["system"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return {"status": "healthy", "service": settings.APP_NAME}
