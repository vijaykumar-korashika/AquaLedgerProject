import pytest
from django.core.management import call_command

from apps.accounts.models import User
from apps.catalog.demo_data import DEMO_PRODUCTS
from apps.catalog.models import Category, Product

DEMO_SKUS = [p["sku"] for p in DEMO_PRODUCTS]


@pytest.mark.django_db
def test_seed_demo_is_idempotent():
    call_command("seed_demo")
    call_command("seed_demo")

    assert User.objects.filter(email="owner@aqualedger360.test", role=User.Role.OWNER).exists()
    assert User.objects.filter(
        email="customer@aqualedger360.test", role=User.Role.CUSTOMER
    ).exists()
    assert Category.objects.filter(slug__in=["fish", "plants", "medicine", "liquids"]).count() == 4
    assert Product.objects.filter(sku__in=DEMO_SKUS).count() == len(DEMO_PRODUCTS)
    assert Product.objects.filter(sku="LIQ-BAC-118", stock_quantity=3).exists()
    assert Product.objects.filter(sku="FSH-GOLD-3", stock_quantity=0).exists()
    assert Product.objects.filter(sku="FSH-ANGEL-D", is_active=False).exists()
    assert (
        Product.objects.filter(sku__in=DEMO_SKUS, images__isnull=False)
        .distinct()
        .count()
        == len(DEMO_PRODUCTS)
    )


@pytest.mark.django_db
def test_seed_demo_skip_flags():
    call_command("seed_demo", skip_owner=True, skip_customer=True)

    assert not User.objects.filter(email="owner@aqualedger360.test").exists()
    assert not User.objects.filter(email="customer@aqualedger360.test").exists()
    assert Product.objects.filter(sku__in=DEMO_SKUS).count() == len(DEMO_PRODUCTS)
