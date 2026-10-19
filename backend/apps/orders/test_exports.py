import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def owner(db):
    return User.objects.create_user(
        email="owner@aqualedger360.test",
        password="OwnerPass123!",
        role=User.Role.OWNER,
    )


@pytest.fixture
def customer(db):
    return User.objects.create_user(
        email="customer@aqualedger360.test",
        password="CustomerPass123!",
        role=User.Role.CUSTOMER,
    )


def auth(client, email, password):
    token = client.post(
        "/api/auth/token/",
        {"email": email, "password": password},
        format="json",
    ).data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")


@pytest.mark.django_db
def test_health_endpoint(client):
    response = client.get("/api/health/")
    assert response.status_code == 200
    assert response.data["status"] == "ok"


@pytest.mark.django_db
def test_export_orders_requires_owner(client, customer, owner):
    auth(client, customer.email, "CustomerPass123!")
    denied = client.get("/api/reports/export/orders/")
    assert denied.status_code == 403

    auth(client, owner.email, "OwnerPass123!")
    allowed = client.get("/api/reports/export/orders/")
    assert allowed.status_code == 200
    assert "text/csv" in allowed["Content-Type"]
    assert "order_number" in allowed.content.decode("utf-8")
