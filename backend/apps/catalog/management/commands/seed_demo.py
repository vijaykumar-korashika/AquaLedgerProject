from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.catalog.demo_data import (
    DEFAULT_OWNER,
    DEMO_CATEGORIES,
    DEMO_CUSTOMER,
    DEMO_IMAGE_KEYS,
    DEMO_PRODUCTS,
    LEGACY_SKUS,
)
from django.core.files.base import ContentFile

from apps.catalog.demo_images import render_product_image
from apps.catalog.models import Category, Product, ProductImage
from apps.catalog.utils import unique_slug


class Command(BaseCommand):
    help = (
        "Load demo data in order: owner → customer → categories → products. "
        "Safe to run multiple times (updates by email / slug / SKU)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-owner",
            action="store_true",
            help="Do not create or update the demo owner account.",
        )
        parser.add_argument(
            "--skip-customer",
            action="store_true",
            help="Do not create or update the demo customer account.",
        )
        parser.add_argument(
            "--owner-email",
            default=DEFAULT_OWNER["email"],
            help=f"Owner email (default: {DEFAULT_OWNER['email']}).",
        )
        parser.add_argument(
            "--owner-password",
            default=DEFAULT_OWNER["password"],
            help="Owner password (default: OwnerPass123!).",
        )
        parser.add_argument(
            "--customer-password",
            default=DEMO_CUSTOMER["password"],
            help="Demo customer password (default: CustomerPass123!).",
        )
        parser.add_argument(
            "--refresh-images",
            action="store_true",
            help="Regenerate demo product photos (adds missing images by default).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Step 1 — Owner account"))
        if options["skip_owner"]:
            self.stdout.write("  Skipped.")
        else:
            self._seed_owner(options["owner_email"], options["owner_password"])

        self.stdout.write(self.style.MIGRATE_HEADING("Step 2 — Demo customer"))
        if options["skip_customer"]:
            self.stdout.write("  Skipped.")
        else:
            self._seed_customer(options["customer_password"])

        self.stdout.write(self.style.MIGRATE_HEADING("Step 3 — Categories"))
        categories = self._seed_categories()

        self.stdout.write(self.style.MIGRATE_HEADING("Step 4 — Products"))
        created, updated = self._seed_products(categories)

        self.stdout.write(self.style.MIGRATE_HEADING("Step 5 — Product photos"))
        images_added = self._seed_product_images(
            refresh=options["refresh_images"]
        )
        self.stdout.write(f"  Photos attached: {images_added}")

        self.stdout.write(self.style.MIGRATE_HEADING("Step 6 — Hide legacy equipment SKUs"))
        hidden = self._hide_legacy_catalog()
        self.stdout.write(f"  Legacy products deactivated: {hidden}")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Demo seed complete."))
        self.stdout.write(
            f"  Categories: {len(categories)} | Products created: {created} | "
            f"Products updated: {updated}"
        )
        if not options["skip_owner"]:
            self.stdout.write(f"  Owner login: {options['owner_email']}")
        if not options["skip_customer"]:
            self.stdout.write(f"  Customer login: {DEMO_CUSTOMER['email']}")

    def _seed_owner(self, email, password):
        email = email.lower().strip()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": email, "role": User.Role.OWNER},
        )
        user.username = email
        user.role = User.Role.OWNER
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        verb = "Created" if created else "Updated"
        self.stdout.write(f"  {verb} owner: {email}")

    def _seed_customer(self, password):
        data = {**DEMO_CUSTOMER, "password": password}
        email = data["email"].lower().strip()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "role": User.Role.CUSTOMER,
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "phone": data["phone"],
                "address": data["address"],
                "city": data["city"],
                "postal_code": data["postal_code"],
            },
        )
        user.username = email
        user.role = User.Role.CUSTOMER
        user.first_name = data["first_name"]
        user.last_name = data["last_name"]
        user.phone = data["phone"]
        user.address = data["address"]
        user.city = data["city"]
        user.postal_code = data["postal_code"]
        user.set_password(password)
        user.save()
        verb = "Created" if created else "Updated"
        self.stdout.write(f"  {verb} customer: {email}")

    def _seed_categories(self):
        by_slug = {}
        for row in DEMO_CATEGORIES:
            category, created = Category.objects.get_or_create(
                slug=row["slug"],
                defaults={
                    "name": row["name"],
                    "description": row["description"],
                    "is_active": True,
                },
            )
            if not created:
                category.name = row["name"]
                category.description = row["description"]
                category.is_active = True
                category.save(
                    update_fields=["name", "description", "is_active", "updated_at"]
                )
            by_slug[row["slug"]] = category
            verb = "Created" if created else "Updated"
            self.stdout.write(f"  {verb} category: {category.name}")
        return by_slug

    def _seed_products(self, categories):
        created_count = 0
        updated_count = 0
        for row in DEMO_PRODUCTS:
            category = categories[row["category_slug"]]
            product, created = Product.objects.get_or_create(
                sku=row["sku"],
                defaults={
                    "category": category,
                    "name": row["name"],
                    "slug": unique_slug(Product, row["name"]),
                    "description": row["description"],
                    "price": row["price"],
                    "stock_quantity": row["stock_quantity"],
                    "low_stock_threshold": row["low_stock_threshold"],
                    "is_active": row.get("is_active", True),
                },
            )
            if created:
                created_count += 1
                self.stdout.write(f"  Created product: {product.sku} — {product.name}")
            else:
                product.category = category
                product.name = row["name"]
                product.description = row["description"]
                product.price = row["price"]
                product.stock_quantity = row["stock_quantity"]
                product.low_stock_threshold = row["low_stock_threshold"]
                product.is_active = row.get("is_active", True)
                product.save(
                    update_fields=[
                        "category",
                        "name",
                        "description",
                        "price",
                        "stock_quantity",
                        "low_stock_threshold",
                        "is_active",
                        "updated_at",
                    ]
                )
                updated_count += 1
                self.stdout.write(f"  Updated product: {product.sku} — {product.name}")
        return created_count, updated_count

    def _seed_product_images(self, refresh=False):
        added = 0
        demo_skus = [row["sku"] for row in DEMO_PRODUCTS]
        products = Product.objects.filter(sku__in=demo_skus).select_related("category")

        for product in products:
            category_slug = product.category.slug
            if refresh:
                product.images.all().delete()

            if product.images.exists():
                continue

            image_key = DEMO_IMAGE_KEYS.get(product.sku, "canister_filter")
            buffer = render_product_image(
                product.name, category_slug, product.sku, image_key
            )
            filename = f"{product.sku.lower()}.jpg"
            ProductImage.objects.create(
                product=product,
                image=ContentFile(buffer.read(), name=filename),
                alt_text=product.name,
                is_primary=True,
                sort_order=0,
            )
            added += 1
            self.stdout.write(f"  Image: {product.sku}")
        return added

    def _hide_legacy_catalog(self):
        legacy_slugs = ["filtration", "lighting", "water-care", "aquascaping"]
        Category.objects.filter(slug__in=legacy_slugs).update(is_active=False)
        return Product.objects.filter(sku__in=LEGACY_SKUS).update(is_active=False)
