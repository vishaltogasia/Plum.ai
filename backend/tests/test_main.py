import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database.session import Base, get_db
from backend.models import models
from backend.auth import hash as auth_hash

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def db():
    """Fixture to provide a test database session."""
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user(db):
    """Fixture to create a test user."""
    user = models.User(
        email="test@example.com",
        hashed_password=auth_hash.hash_password("testpass123"),
        full_name="Test User",
        is_active=True,
        is_superuser=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_business(db, test_user):
    """Fixture to create a test business."""
    business = models.Business(
        owner_id=test_user.id,
        name="Test Business",
        description="A test business",
        system_prompt="You are a helpful assistant."
    )
    db.add(business)
    db.commit()
    db.refresh(business)
    return business

# ==========================================
# Authentication Tests
# ==========================================

class TestAuthentication:
    
    def test_user_registration(self):
        """Test user registration endpoint."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepass123",
                "full_name": "New User"
            }
        )
        assert response.status_code == 201
        assert "access_token" in response.json()
        assert "refresh_token" in response.json()
    
    def test_registration_duplicate_email(self):
        """Test registration with duplicate email."""
        # First registration
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "pass123",
                "full_name": "User"
            }
        )
        
        # Try duplicate
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "pass123",
                "full_name": "User"
            }
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_user_login(self):
        """Test user login endpoint."""
        # Create user
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "login@example.com",
                "password": "testpass123",
                "full_name": "Login User"
            }
        )
        
        # Login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "login@example.com",
                "password": "testpass123"
            }
        )
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpass"
            }
        )
        assert response.status_code == 400
        assert "Incorrect" in response.json()["detail"]

# ==========================================
# Business Tests
# ==========================================

class TestBusiness:
    
    def test_get_health_check(self):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

# ==========================================
# URL Scraper Tests
# ==========================================

class TestURLScraper:
    
    def test_valid_url_format(self):
        """Test URL validation."""
        from backend.services.scraper import url_scraper
        
        assert url_scraper.is_valid_url("https://www.example.com")
        assert url_scraper.is_valid_url("http://example.com")
        assert not url_scraper.is_valid_url("not a url")
        assert not url_scraper.is_valid_url("")

# ==========================================
# Rate Limiting Tests
# ==========================================

class TestRateLimiting:
    
    def test_rate_limit_enabled(self):
        """Test that rate limiting is enabled on app."""
        assert hasattr(app, "state")
        assert hasattr(app.state, "limiter")

# ==========================================
# Password Hashing Tests
# ==========================================

class TestPasswordHashing:
    
    def test_password_hash_and_verify(self):
        """Test password hashing and verification."""
        password = "mysecurepassword123"
        hashed = auth_hash.hash_password(password)
        
        # Verify correct password
        assert auth_hash.verify_password(password, hashed)
        
        # Verify incorrect password
        assert not auth_hash.verify_password("wrongpassword", hashed)
    
    def test_password_hash_is_unique(self):
        """Test that password hashes are unique each time."""
        password = "samepassword"
        hash1 = auth_hash.hash_password(password)
        hash2 = auth_hash.hash_password(password)
        
        # Hashes should be different due to salt
        assert hash1 != hash2
        
        # But both should verify with original password
        assert auth_hash.verify_password(password, hash1)
        assert auth_hash.verify_password(password, hash2)

# ==========================================
# Models Tests
# ==========================================

class TestModels:
    
    def test_user_model(self, db):
        """Test User model creation."""
        user = models.User(
            email="model@example.com",
            hashed_password="hashed_pwd",
            full_name="Model User",
            is_active=True,
            is_superuser=False
        )
        db.add(user)
        db.commit()
        
        retrieved_user = db.query(models.User).filter(models.User.email == "model@example.com").first()
        assert retrieved_user is not None
        assert retrieved_user.full_name == "Model User"
    
    def test_business_model(self, db, test_user):
        """Test Business model creation."""
        business = models.Business(
            owner_id=test_user.id,
            name="Test Biz",
            description="Test Description"
        )
        db.add(business)
        db.commit()
        
        retrieved = db.query(models.Business).filter(models.Business.name == "Test Biz").first()
        assert retrieved is not None
        assert retrieved.owner_id == test_user.id
    
    def test_team_model(self, db, test_business):
        """Test Team model creation."""
        team = models.Team(
            business_id=test_business.id,
            name="Test Team"
        )
        db.add(team)
        db.commit()
        
        retrieved = db.query(models.Team).filter(models.Team.business_id == test_business.id).first()
        assert retrieved is not None
        assert retrieved.name == "Test Team"

# ==========================================
# Configuration Tests
# ==========================================

class TestConfiguration:
    
    def test_app_settings_loaded(self):
        """Test that app settings are properly loaded."""
        from backend.utils.config import settings
        
        assert settings.APP_NAME == "Plum.ai"
        assert settings.API_V1_STR == "/api/v1"
        assert len(settings.CORS_ORIGINS) > 0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
