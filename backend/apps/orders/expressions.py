from decimal import Decimal

from django.db.models import DecimalField, Value

# Coalesce default for Decimal aggregates (Sum on money fields).
DECIMAL_ZERO = Value(
    Decimal("0"),
    output_field=DecimalField(max_digits=12, decimal_places=2),
)
