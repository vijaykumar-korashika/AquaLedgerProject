from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce

from apps.accounts.models import User
from apps.orders.expressions import DECIMAL_ZERO
from apps.orders.models import Order

PAID_ORDERS = ~Q(orders__status=Order.Status.CANCELLED)


def customers_with_stats():
    return User.objects.filter(role=User.Role.CUSTOMER).annotate(
        order_count=Count("orders", filter=PAID_ORDERS, distinct=True),
        total_spent=Coalesce(
            Sum("orders__total", filter=PAID_ORDERS),
            DECIMAL_ZERO,
        ),
    )
