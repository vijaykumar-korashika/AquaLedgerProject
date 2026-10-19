import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Category, Product, ProductImage


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


def auth(client, user):
    token = client.post(
        "/api/auth/token/",
        {"email": user.email, "password": "OwnerPass123!"},
        format="json",
    ).data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")


def tiny_png():
    from io import BytesIO

    from PIL import Image

    buf = BytesIO()
    Image.new("RGB", (16, 16), (0, 120, 200)).save(buf, format="PNG")
    return SimpleUploadedFile("test.png", buf.getvalue(), content_type="image/png")


@pytest.mark.django_db
def test_owner_can_upload_and_replace_product_image(client, owner):
    category = Category.objects.create(name="Fish", slug="fish")
    product = Product.objects.create(
        category=category,
        name="Test Fish",
        slug="test-fish",
        sku="TST-FISH",
        price="10.00",
        stock_quantity=5,
    )
    auth(client, owner)

    upload = client.post(
        f"/api/products/{product.id}/images/",
        {"image": tiny_png()},
        format="multipart",
    )
    assert upload.status_code == 201
    image_id = upload.data["id"]

    replace = client.patch(
        f"/api/products/{product.id}/images/{image_id}/",
        {"image": tiny_png()},
        format="multipart",
    )
    assert replace.status_code == 200

    primary = client.patch(
        f"/api/products/{product.id}/images/{image_id}/",
        {"is_primary": True},
        format="json",
    )
    assert primary.status_code == 200
    assert primary.data["is_primary"] is True

    delete = client.delete(f"/api/products/{product.id}/images/{image_id}/")
    assert delete.status_code == 204
    assert ProductImage.objects.filter(product=product).count() == 0
