from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.accounts.views import CustomerDetailView, CustomerListView, CustomerStatsView
from config.views import HealthView

urlpatterns = [
    path("api/health/", HealthView.as_view(), name="health"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/customers/", CustomerListView.as_view(), name="customer-list"),
    path("api/customers/stats/", CustomerStatsView.as_view(), name="customer-stats"),
    path("api/customers/<int:pk>/", CustomerDetailView.as_view(), name="customer-detail"),
    path("api/", include("apps.catalog.urls")),
    path("api/", include("apps.orders.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
