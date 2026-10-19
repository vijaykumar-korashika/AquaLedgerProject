from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.orders.export_views import (
    ExportCustomersCsvView,
    ExportInventoryCsvView,
    ExportOrdersCsvView,
    ExportProductsCsvView,
)
from apps.orders.views import CartItemView, CartView, OrderViewSet, ReportSummaryView

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/items/", CartItemView.as_view(), name="cart-items"),
    path("cart/items/<int:item_id>/", CartItemView.as_view(), name="cart-item"),
    path("reports/summary/", ReportSummaryView.as_view(), name="report-summary"),
    path("reports/export/orders/", ExportOrdersCsvView.as_view(), name="export-orders"),
    path("reports/export/products/", ExportProductsCsvView.as_view(), name="export-products"),
    path("reports/export/inventory/", ExportInventoryCsvView.as_view(), name="export-inventory"),
    path("reports/export/customers/", ExportCustomersCsvView.as_view(), name="export-customers"),
    path("", include(router.urls)),
]
