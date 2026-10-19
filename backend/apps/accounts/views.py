from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.customer_stats import customers_with_stats
from apps.accounts.models import User
from apps.accounts.permissions import IsOwner
from apps.accounts.serializers import (
    AquaTokenObtainPairSerializer,
    CustomerAdminSerializer,
    RegisterSerializer,
    UserSerializer,
)
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["email"] = user.email
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = AquaTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class CustomerListView(generics.ListAPIView):
    permission_classes = [IsOwner]
    serializer_class = CustomerAdminSerializer
    search_fields = ["email", "first_name", "last_name", "phone", "city"]
    ordering_fields = ["date_joined", "email", "total_spent", "order_count"]
    ordering = ["-date_joined"]

    def get_queryset(self):
        return customers_with_stats()


class CustomerDetailView(APIView):
    permission_classes = [IsOwner]

    def get(self, request, pk):
        try:
            customer = customers_with_stats().get(pk=pk, role=User.Role.CUSTOMER)
        except User.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        orders = (
            Order.objects.filter(user=customer)
            .prefetch_related("items")
            .order_by("-created_at")[:10]
        )
        return Response(
            {
                "customer": CustomerAdminSerializer(customer).data,
                "recent_orders": OrderSerializer(orders, many=True).data,
            }
        )


class CustomerStatsView(APIView):
    """Aggregate customer metrics for the owner customers page header."""

    permission_classes = [IsOwner]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta

        qs = customers_with_stats()
        thirty_days_ago = timezone.now() - timedelta(days=30)
        total = qs.count()
        with_orders = qs.filter(order_count__gt=0).count()
        new_30d = qs.filter(date_joined__gte=thirty_days_ago).count()
        return Response(
            {
                "total_customers": total,
                "customers_with_orders": with_orders,
                "new_customers_30d": new_30d,
            }
        )
