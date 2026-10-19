from django.db.models import Count, F, Sum
from django.db.models.functions import Coalesce
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsCustomer, IsOwner
from apps.catalog.models import Product
from apps.orders.expressions import DECIMAL_ZERO
from apps.orders.models import Cart, CartItem, Order, OrderItem
from apps.orders.serializers import (
    AddCartItemSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderSerializer,
    OrderStatusSerializer,
    UpdateCartItemSerializer,
)


class CartView(APIView):
    permission_classes = [IsCustomer]

    def get_cart(self, user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def get(self, request):
        cart = self.get_cart(request.user)
        cart = Cart.objects.prefetch_related("items__product").get(pk=cart.pk)
        return Response(CartSerializer(cart).data)


class CartItemView(APIView):
    permission_classes = [IsCustomer]

    def get_cart(self, user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.context["product"]
        quantity = serializer.validated_data["quantity"]
        cart = self.get_cart(request.user)

        item, created = CartItem.objects.get_or_create(
            cart=cart, product=product, defaults={"quantity": quantity}
        )
        if not created:
            new_qty = item.quantity + quantity
            if new_qty > product.stock_quantity:
                return Response(
                    {"quantity": f"Only {product.stock_quantity} in stock."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.quantity = new_qty
            item.save(update_fields=["quantity"])

        cart = Cart.objects.prefetch_related("items__product").get(pk=cart.pk)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    def patch(self, request, item_id):
        cart = self.get_cart(request.user)
        try:
            item = CartItem.objects.select_related("product").get(
                pk=item_id, cart=cart
            )
        except CartItem.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data["quantity"]
        if quantity > item.product.stock_quantity:
            return Response(
                {"quantity": f"Only {item.product.stock_quantity} in stock."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        item.quantity = quantity
        item.save(update_fields=["quantity"])
        cart = Cart.objects.prefetch_related("items__product").get(pk=cart.pk)
        return Response(CartSerializer(cart).data)

    def delete(self, request, item_id):
        cart = self.get_cart(request.user)
        deleted, _ = CartItem.objects.filter(pk=item_id, cart=cart).delete()
        if not deleted:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        cart = Cart.objects.prefetch_related("items__product").get(pk=cart.pk)
        return Response(CartSerializer(cart).data)


class OrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = OrderSerializer
    filterset_fields = ["status"]
    search_fields = ["number", "shipping_name"]
    ordering_fields = ["created_at", "total"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action == "create":
            return [IsCustomer()]
        if self.action == "set_status":
            return [IsOwner()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Order.objects.prefetch_related("items").select_related("user")
        if self.request.user.is_owner:
            return qs
        return qs.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = CheckoutSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(
            OrderSerializer(order).data, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["patch"], url_path="status")
    def set_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusSerializer(
            data=request.data, context={"order": order}
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data)


class ReportSummaryView(APIView):
    permission_classes = [IsOwner]

    def get(self, request):
        from datetime import timedelta

        from django.utils import timezone

        from apps.accounts.customer_stats import customers_with_stats
        from apps.accounts.models import User
        from apps.accounts.serializers import CustomerSummarySerializer

        low_stock = list(
            Product.objects.filter(is_active=True)
            .filter(stock_quantity__lte=F("low_stock_threshold"))
            .order_by("stock_quantity")[:10]
            .values("id", "name", "sku", "stock_quantity", "low_stock_threshold")
        )

        orders_by_status = {
            row["status"]: row["count"]
            for row in Order.objects.values("status").annotate(count=Count("id"))
        }
        paid_orders = Order.objects.exclude(status=Order.Status.CANCELLED)
        revenue = paid_orders.aggregate(
            total=Coalesce(Sum("total"), DECIMAL_ZERO)
        ).get("total")
        order_count = paid_orders.count()
        average_order_value = (revenue / order_count) if order_count else 0

        thirty_days_ago = timezone.now() - timedelta(days=30)
        sixty_days_ago = timezone.now() - timedelta(days=60)

        active_products = Product.objects.filter(is_active=True)
        stock_totals = active_products.aggregate(
            total_units=Coalesce(Sum("stock_quantity"), 0),
        )
        inventory_value = active_products.aggregate(
            retail_value=Coalesce(
                Sum(F("stock_quantity") * F("price")),
                DECIMAL_ZERO,
            ),
        ).get("retail_value")

        sold_lines = OrderItem.objects.exclude(
            order__status=Order.Status.CANCELLED
        )
        units_sold = sold_lines.aggregate(
            total=Coalesce(Sum("quantity"), 0),
        ).get("total")

        revenue_30d = paid_orders.filter(created_at__gte=thirty_days_ago).aggregate(
            total=Coalesce(Sum("total"), DECIMAL_ZERO)
        ).get("total")
        revenue_prev_30d = paid_orders.filter(
            created_at__gte=sixty_days_ago,
            created_at__lt=thirty_days_ago,
        ).aggregate(total=Coalesce(Sum("total"), DECIMAL_ZERO)).get("total")
        if revenue_prev_30d:
            revenue_trend_pct = float(
                (revenue_30d - revenue_prev_30d) / revenue_prev_30d * 100
            )
        else:
            revenue_trend_pct = None

        units_sold_30d = sold_lines.filter(
            order__created_at__gte=thirty_days_ago
        ).aggregate(total=Coalesce(Sum("quantity"), 0)).get("total")

        trending_products = list(
            sold_lines.values("product_id", "product_name", "sku")
            .annotate(
                units_sold=Coalesce(Sum("quantity"), 0),
                revenue=Coalesce(Sum("line_total"), DECIMAL_ZERO),
            )
            .order_by("-units_sold")[:8]
        )
        customer_qs = customers_with_stats()
        top_customers = CustomerSummarySerializer(
            customer_qs.filter(order_count__gt=0).order_by("-total_spent")[:5],
            many=True,
        ).data
        recent_customers = CustomerSummarySerializer(
            customer_qs.order_by("-date_joined")[:5],
            many=True,
        ).data

        recent_orders = OrderSerializer(
            Order.objects.prefetch_related("items")
            .select_related("user")
            .order_by("-created_at")[:10],
            many=True,
        ).data

        return Response(
            {
                "products": {
                    "total": Product.objects.count(),
                    "active": active_products.count(),
                    "out_of_stock": active_products.filter(stock_quantity=0).count(),
                    "total_stock_units": stock_totals.get("total_units") or 0,
                    "inventory_retail_value": inventory_value,
                    "low_stock": low_stock,
                },
                "sales": {
                    "units_sold": units_sold or 0,
                    "units_sold_30d": units_sold_30d or 0,
                    "revenue_30d": revenue_30d,
                    "revenue_trend_pct": revenue_trend_pct,
                },
                "trending_products": trending_products,
                "customers": {
                    "total": customer_qs.count(),
                    "new_30d": customer_qs.filter(
                        date_joined__gte=thirty_days_ago
                    ).count(),
                    "with_orders": customer_qs.filter(order_count__gt=0).count(),
                    "top": top_customers,
                    "recent": recent_customers,
                },
                "orders": {
                    "total": Order.objects.count(),
                    "pending": Order.objects.filter(
                        status=Order.Status.PENDING
                    ).count(),
                    "paid_count": order_count,
                    "average_value": average_order_value,
                },
                "orders_by_status": orders_by_status,
                "revenue": revenue,
                "recent_orders": recent_orders,
            }
        )
