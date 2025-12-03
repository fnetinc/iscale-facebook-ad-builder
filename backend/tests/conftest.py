import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import MagicMock, patch

from app.main import app
from app.database import Base, get_db
from app.models import User, Role
from app.core.security import get_password_hash


# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Create a test user with admin role and all permissions."""
    from app.models import Permission

    # Create permissions
    campaigns_write = Permission(name="campaigns:write", description="Write campaigns")
    ads_write = Permission(name="ads:write", description="Write ads")
    ads_delete = Permission(name="ads:delete", description="Delete ads")
    db_session.add(campaigns_write)
    db_session.add(ads_write)
    db_session.add(ads_delete)

    # Create admin role
    admin_role = Role(name="admin", description="Administrator")
    admin_role.permissions.append(campaigns_write)
    admin_role.permissions.append(ads_write)
    admin_role.permissions.append(ads_delete)
    db_session.add(admin_role)
    db_session.commit()

    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        name="Test User",
        is_active=True
    )
    user.roles.append(admin_role)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers for test user."""
    response = client.post(
        "/api/v1/auth/login/json",
        json={"email": "test@example.com", "password": "testpassword"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_facebook_service(client):
    """Mock FacebookService for testing."""
    from app.api.v1.facebook import get_facebook_service

    service = MagicMock()
    service.api = MagicMock()

    def override_get_facebook_service():
        return service

    app.dependency_overrides[get_facebook_service] = override_get_facebook_service
    yield service
    # Clean up the override
    if get_facebook_service in app.dependency_overrides:
        del app.dependency_overrides[get_facebook_service]
