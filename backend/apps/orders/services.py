from decimal import Decimal, ROUND_HALF_UP

from django.db import connection, transaction
from rest_framework.exceptions import ValidationError

from apps.catalog.models import Product
from apps.orders.models import Cart, Order, OrderItem


def money(value):
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def locked_queryset(queryset):
    if connection.features.has_select_for_update:
        return queryset.select_for_update()
    return queryset


STATUS_TRANSITIONS = {
    Order.Status.PENDING: {
        Order.Status.CONFIRMED,
        Order.Status.PROCESSING,
        Order.Status.CANCELLED,
    },
    Order.Status.CONFIRMED: {
        Order.Status.PROCESSING,
        Order.Status.SHIPPED,
        Order.Status.CANCELLED,
    },
    Order.Status.PROCESSING: {
        Order.Status.SHIPPED,
        Order.Status.CANCELLED,
    },
    Order.Status.SHIPPED: {
        Order.Status.DELIVERED,
        Order.Status.CANCELLED,
    },
    Order.Status.DELIVERED: set(),
    Order.Status.CANCELLED: set(),
}


def place_order(user, shipping_data):
    with transaction.atomic():
        cart = locked_queryset(Cart.objects.filter(user=user)).first()
        if cart is None:
            raise ValidationError({"detail": "Your cart is empty."})

        cart_items = list(cart.items.select_related("product"))
        if not cart_items:
            raise ValidationError({"detail": "Your cart is empty."})

        product_ids = [item.product_id for item in cart_items]
        products = {
            p.id: p
            for p in locked_queryset(Product.objects.filter(id__in=product_ids))
        }

        for item in cart_items:
            product = products[item.product_id]
            if not product.is_active:
                raise ValidationError(
                    {"detail": f"{product.name} is no longer available."}
                )
            if item.quantity > product.stock_quantity:
                raise ValidationError(
                    {
                        "detail": (
                            f"Only {product.stock_quantity} of {product.name} "
                            "remain in stock."
                        )
                    }
                )

        order = Order.objects.create(
            user=user,
            subtotal=Decimal("0.00"),
            total=Decimal("0.00"),
            status=Order.Status.PENDING,
            **shipping_data,
        )

        subtotal = Decimal("0.00")
        for item in cart_items:
            product = products[item.product_id]
            line_total = money(product.price * item.quantity)
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                sku=product.sku,
                unit_price=product.price,
                quantity=item.quantity,
                line_total=line_total,
            )
            product.stock_quantity -= item.quantity
            product.save(update_fields=["stock_quantity", "updated_at"])
            subtotal += line_total

        order.subtotal = subtotal
        order.total = subtotal
        order.number = f"AL360-{order.pk:06d}"
        order.save(update_fields=["subtotal", "total", "number"])

        cart.items.all().delete()
        return order


def set_order_status(order_id, new_status):
    with transaction.atomic():
        order = locked_queryset(Order.objects.filter(pk=order_id)).get()
        allowed = STATUS_TRANSITIONS.get(order.status, set())
        if new_status not in allowed:
            raise ValidationError(
                {
                    "status": (
                        f"Cannot change status from {order.status} to {new_status}."
                    )
                }
            )

        if new_status == Order.Status.CANCELLED:
            for item in order.items.select_related("product"):
                product = locked_queryset(
                    Product.objects.filter(pk=item.product_id)
                ).get()
                product.stock_quantity += item.quantity
                product.save(update_fields=["stock_quantity", "updated_at"])

        order.status = new_status
        order.save(update_fields=["status", "updated_at"])
        return order
