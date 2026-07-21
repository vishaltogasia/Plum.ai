# Testing Guide

This document explains how to run tests for the Plum.ai project.

## Prerequisites

Make sure pytest and required dependencies are installed:

```bash
pip install pytest pytest-cov pytest-asyncio httpx
```

All dependencies are in `requirements.txt`, so if you've installed the project dependencies, you're ready.

## Running Tests

### Run All Tests

```bash
# From backend directory
cd backend
pytest

# Or with coverage
pytest --cov=. --cov-report=html
```

### Run Specific Test File

```bash
pytest tests/test_main.py
pytest tests/test_api.py
```

### Run Specific Test Class

```bash
pytest tests/test_api.py::TestAuthEndpoints
```

### Run Specific Test Function

```bash
pytest tests/test_api.py::TestAuthEndpoints::test_register_new_user
```

### Run Tests with Markers

```bash
# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Skip slow tests
pytest -m "not slow"
```

### Run with Verbose Output

```bash
pytest -v
```

### Run with Output of Prints

```bash
pytest -s
```

## Test Organization

### Test Structure

```
backend/
├── tests/
│   ├── __init__.py          # Package marker
│   ├── conftest.py          # Shared fixtures
│   ├── test_main.py         # Core functionality tests
│   └── test_api.py          # API endpoint tests
├── pytest.ini               # Pytest configuration
└── requirements.txt         # Dependencies
```

### Test Categories

1. **Unit Tests**: Test individual functions and classes in isolation
2. **Integration Tests**: Test multiple components working together
3. **API Tests**: Test REST endpoints and HTTP responses

## Fixtures

Common pytest fixtures are defined in `conftest.py`:

### Available Fixtures

- `client`: FastAPI TestClient for making HTTP requests
- `db_session`: SQLAlchemy database session for database testing
- `test_user`: A pre-created test user
- `test_admin_user`: A pre-created admin test user
- `test_business`: A pre-created test business workspace
- `auth_headers`: JWT authentication headers for a test user
- `admin_auth_headers`: JWT authentication headers for admin user

### Using Fixtures

```python
def test_something(client, auth_headers, test_user):
    # client: TestClient instance
    # auth_headers: Dict with Authorization header
    # test_user: User model instance
    response = client.get(
        "/api/v1/profile",
        headers=auth_headers
    )
    assert response.status_code == 200
```

## Coverage Report

Generate and view coverage reports:

```bash
# Generate coverage report
pytest --cov=. --cov-report=html

# Open in browser
open htmlcov/index.html  # macOS
start htmlcov/index.html # Windows
xdg-open htmlcov/index.html # Linux
```

## Continuous Integration

To run tests in CI/CD pipeline:

```bash
# Run tests and exit with failure if any fail
pytest --tb=short --no-header

# Generate JUnit XML for CI systems
pytest --junit-xml=test-results.xml

# Fail on any warning
pytest -W error::Warning
```

## Debugging Tests

### Run with Debugger

```bash
# Use pdb for debugging
pytest -pdb tests/test_api.py::TestAuthEndpoints::test_register_new_user

# Drop into debugger on failure
pytest -pdb --pdbcls=IPython.terminal.debugger:TerminalPdb
```

### Print Debug Info

```python
def test_something(client):
    response = client.get("/health")
    print(response.json())  # Will show with pytest -s
    assert response.status_code == 200
```

## Best Practices

1. **Use Fixtures**: Leverage conftest.py fixtures for setup/teardown
2. **Test One Thing**: Each test should verify one behavior
3. **Use Descriptive Names**: Test names should explain what they test
4. **Clean up**: Fixtures automatically clean up test data (db drops tables)
5. **Mock External Services**: Use mocking for external APIs
6. **Test Error Cases**: Include tests for error conditions and edge cases
7. **Keep Tests Fast**: Use markers like `@pytest.mark.slow` for long tests
8. **Group Related Tests**: Use test classes to organize related tests

## Common Issues

### Database Lock Errors

If you get database lock errors during tests:

```bash
# Clean up test database
rm backend/test.db

# Run tests again
pytest
```

### Import Errors

If tests can't find modules:

```bash
# Add backend to Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend"
pytest
```

### Fixture Not Found

Make sure `conftest.py` is in the `tests/` directory and the package structure is correct.

## Example Test

Here's a complete example test:

```python
import pytest

class TestUserAPI:
    """Test user-related endpoints."""
    
    def test_get_user_profile(self, client, auth_headers, test_user):
        """Test retrieving user profile information."""
        # Make authenticated request
        response = client.get(
            "/api/v1/auth/profile",
            headers=auth_headers
        )
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["is_active"] is True
    
    @pytest.mark.parametrize("role", ["admin", "user", "guest"])
    def test_update_profile_various_roles(self, client, auth_headers, role):
        """Test profile update with different roles."""
        response = client.put(
            "/api/v1/auth/profile",
            json={"full_name": f"User {role}"},
            headers=auth_headers
        )
        assert response.status_code == 200
```

## Additional Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing Guide](https://fastapi.tiangolo.com/advanced/testing-dependencies/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/14/orm/session_transaction.html)

---

For questions or issues with tests, please refer to the main project README or contact the development team.
