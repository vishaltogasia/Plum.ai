import pytest
from backend.models import models

class TestAuthEndpoints:
    """Tests for authentication endpoints."""
    
    def test_register_new_user(self, client):
        """Test user registration."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@test.com",
                "password": "securepass123",
                "full_name": "New User"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "securepass123",
                "full_name": "User"
            }
        )
        assert response.status_code == 422  # Validation error
    
    def test_login_success(self, client, test_user):
        """Test successful login."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpass123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 400
        assert "Incorrect" in response.json()["detail"]
    
    def test_change_password(self, client, auth_headers, test_user):
        """Test password change."""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "testpass123",
                "new_password": "newpass123456"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
    
    def test_change_password_weak_password(self, client, auth_headers):
        """Test password change with weak password."""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "testpass123",
                "new_password": "weak"
            },
            headers=auth_headers
        )
        assert response.status_code == 400
        assert "8 characters" in response.json()["detail"]

class TestBusinessEndpoints:
    """Tests for business endpoints."""
    
    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

class TestTeamEndpoints:
    """Tests for team management endpoints."""
    
    def test_create_team_unauthorized(self, client):
        """Test creating team without authentication."""
        response = client.post(
            "/api/v1/teams/1",
            json={"name": "Test Team"}
        )
        assert response.status_code == 403  # Forbidden
    
    def test_list_team_members_unauthorized(self, client):
        """Test listing team members without authentication."""
        response = client.get("/api/v1/teams/1/members")
        assert response.status_code == 403

class TestProfileEndpoints:
    """Tests for user profile endpoints."""
    
    def test_update_profile_unauthorized(self, client):
        """Test updating profile without authentication."""
        response = client.put(
            "/api/v1/auth/profile",
            json={"full_name": "New Name"}
        )
        assert response.status_code == 403
    
    def test_update_profile_authenticated(self, client, auth_headers, test_user):
        """Test updating profile when authenticated."""
        response = client.put(
            "/api/v1/auth/profile",
            json={"full_name": "Updated Name"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"

@pytest.mark.integration
class TestIntegrationFlow:
    """Integration tests for complete workflows."""
    
    def test_user_registration_and_login(self, client):
        """Test complete registration and login flow."""
        # Register
        reg_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "integration@test.com",
                "password": "testpass123",
                "full_name": "Integration User"
            }
        )
        assert reg_response.status_code == 201
        reg_data = reg_response.json()
        
        # Login with registered credentials
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "integration@test.com",
                "password": "testpass123"
            }
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        
        # Verify tokens are valid
        assert "access_token" in login_data
        assert "refresh_token" in login_data
