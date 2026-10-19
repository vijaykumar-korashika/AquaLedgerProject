import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Category, Product


@pytest.fixture
def api_client():
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
        first_name="Mina",
        role=User.Role.CUSTOMER,
    )


@pytest.fixture
def product(db):
    category = Category.objects.create(name="Filtration", slug="filtration")
    return Product.objects.create(
        category=category,
        name="Canister Filter",
        slug="canister-filter",
        sku="FIL-400",
        price="189.00",
        stock_quantity=5,
    )


def auth(client, email, password):
    response = client.post(
        "/api/auth/token/",
        {"email": email, "password": password},
        format="json",
    )
    token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")


@pytest.mark.django_db
def test_register_always_creates_customer(api_client):
    response = api_client.post(
        "/api/auth/register/",
        {
            "email": "new@aqualedger360.test",
            "password": "CustomerPass123!",
            "first_name": "New",
            "last_name": "User",
            "role": "owner",
        },
        format="json",
    )
    assert response.status_code == 201
    assert response.data["user"]["role"] == "customer"


@pytest.mark.django_db
def test_owner_report_summary_ok(api_client, owner, product):
    auth(api_client, owner.email, "OwnerPass123!")
    response = api_client.get("/api/reports/summary/")
    assert response.status_code == 200
    body = response.data
    assert "revenue" in body
    assert "sales" in body
    assert "trending_products" in body
    assert "total_stock_units" in body["products"]


@pytest.mark.django_db
def test_customer_cannot_access_owner_endpoints(api_client, customer):
    auth(api_client, customer.email, "CustomerPass123!")
    assert api_client.post("/api/products/", {}, format="json").status_code == 403
    assert api_client.get("/api/customers/").status_code == 403
    assert api_client.get("/api/reports/summary/").status_code == 403


@pytest.mark.django_db
def test_checkout_decrements_stock(api_client, customer, product):
    auth(api_client, customer.email, "CustomerPass123!")
    api_client.post(
        "/api/cart/items/",
        {"product_id": product.id, "quantity": 2},
        format="json",
    )
    response = api_client.post(
        "/api/orders/",
        {
            "shipping_name": "Mina Shah",
            "shipping_phone": "555-0100",
            "shipping_address": "18 Harbor Lane",
            "shipping_city": "Kochi",
        },
        format="json",
    )
    assert response.status_code == 201
    product.refresh_from_db()
    assert product.stock_quantity == 3
    assert response.data["items"][0]["unit_price"] == "189.00"


@pytest.mark.django_db
def test_oversell_blocked_at_checkout(api_client, customer, product):
    auth(api_client, customer.email, "CustomerPass123!")
    api_client.post(
        "/api/cart/items/",
        {"product_id": product.id, "quantity": 2},
        format="json",
    )
    api_client.post(
        "/api/orders/",
        {
            "shipping_name": "Mina Shah",
            "shipping_phone": "555-0100",
            "shipping_address": "18 Harbor Lane",
            "shipping_city": "Kochi",
        },
        format="json",
    )
    api_client.post(
        "/api/cart/items/",
        {"product_id": product.id, "quantity": 4},
        format="json",
    )
    denied = api_client.post(
        "/api/orders/",
        {
            "shipping_name": "Mina Shah",
            "shipping_phone": "555-0100",
            "shipping_address": "18 Harbor Lane",
            "shipping_city": "Kochi",
        },
        format="json",
    )
    assert denied.status_code == 400
    product.refresh_from_db()
    assert product.stock_quantity == 3
