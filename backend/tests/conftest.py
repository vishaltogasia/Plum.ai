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

@pytest.fixture(scope="session")
def client():
    """Provide a test client for API testing."""
    return TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    """Fixture to provide a test database session."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user(db_session):
    """Fixture to create a test user."""
    user = models.User(
        email="testuser@example.com",
        hashed_password=auth_hash.hash_password("testpass123"),
        full_name="Test User",
        is_active=True,
        is_superuser=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_admin_user(db_session):
    """Fixture to create a test admin user."""
    user = models.User(
        email="admin@example.com",
        hashed_password=auth_hash.hash_password("adminpass123"),
        full_name="Admin User",
        is_active=True,
        is_superuser=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_business(db_session, test_user):
    """Fixture to create a test business."""
    business = models.Business(
        owner_id=test_user.id,
        name="Test Business",
        description="A test business",
        system_prompt="You are a helpful assistant."
    )
    db_session.add(business)
    db_session.commit()
    db_session.refresh(business)
    return business

@pytest.fixture
def auth_headers(client, test_user):
    """Fixture to get authentication headers for test requests."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "testpass123"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_auth_headers(client, test_admin_user):
    """Fixture to get admin authentication headers."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_admin_user.email,
            "password": "adminpass123"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
