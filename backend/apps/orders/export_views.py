from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.permissions import IsOwner
from apps.catalog.models import Product
from apps.orders.csv_utils import csv_attachment
from apps.orders.models import Order


class ExportOrdersCsvView(APIView):
    permission_classes = [IsOwner]

    def get(self, request):
        status = request.query_params.get("status")
        qs = Order.objects.select_related("user").order_by("-created_at")
        if status:
            qs = qs.filter(status=status)

        rows = [
            [
                order.number,
                order.user.email,
                order.status,
                order.subtotal,
                order.total,
                order.shipping_name,
                order.shipping_city,
                order.created_at.isoformat(),
            ]
            for order in qs
        ]
        return csv_attachment(
            "aqualedger360-orders.csv",
            [
                "order_number",
                "customer_email",
                "status",
                "subtotal",
                "total",
                "shipping_name",
                "shipping_city",
                "created_at",
            ],
            rows,
        )


class ExportProductsCsvView(APIView):
    permission_classes = [IsOwner]

    def get(self, request):
        qs = Product.objects.select_related("category").order_by("name")
        rows = [
            [
                product.sku,
                product.name,
                product.category.name,
                product.price,
                product.stock_quantity,
                product.low_stock_threshold,
                product.is_active,
            ]
            for product in qs
        ]
        return csv_attachment(
            "aqualedger360-products.csv",
            [
                "sku",
                "name",
                "category",
                "price",
                "stock_quantity",
                "low_stock_threshold",
                "is_active",
            ],
            rows,
        )


class ExportInventoryCsvView(APIView):
    permission_classes = [IsOwner]

    def get(self, request):
        qs = (
            Product.objects.select_related("category")
            .filter(is_active=True)
            .order_by("stock_quantity")
        )
        rows = []
        for product in qs:
            alert = "ok"
            if product.stock_quantity == 0:
                alert = "out_of_stock"
            elif product.stock_quantity <= product.low_stock_threshold:
                alert = "low_stock"
            rows.append(
                [
                    product.sku,
                    product.name,
                    product.category.name,
                    product.stock_quantity,
                    product.low_stock_threshold,
                    alert,
                ]
            )
        return csv_attachment(
            "aqualedger360-inventory.csv",
            ["sku", "name", "category", "stock_quantity", "threshold", "alert"],
            rows,
        )


class ExportCustomersCsvView(APIView):
    permission_classes = [IsOwner]

    def get(self, request):
        qs = User.objects.filter(role=User.Role.CUSTOMER).order_by("-date_joined")
        rows = [
            [
                user.email,
                user.first_name,
                user.last_name,
                user.phone,
                user.city,
                user.postal_code,
                user.date_joined.isoformat() if user.date_joined else "",
            ]
            for user in qs
        ]
        return csv_attachment(
            "aqualedger360-customers.csv",
            ["email", "first_name", "last_name", "phone", "city", "postal_code", "joined_at"],
            rows,
        )
