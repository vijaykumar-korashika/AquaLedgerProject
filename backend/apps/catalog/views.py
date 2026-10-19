import django_filters
from django.db.models import ProtectedError
from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsOwner
from apps.catalog.models import Category, Product, ProductImage
from apps.catalog.image_utils import validate_uploaded_image
from apps.catalog.serializers import (
    CategorySerializer,
    ProductImageSerializer,
    ProductImageUpdateSerializer,
    ProductSerializer,
)


class ProductFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name="category_id")
    category_slug = django_filters.CharFilter(field_name="category__slug")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = ["category", "category_slug", "min_price", "max_price", "in_stock"]

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_quantity__gt=0)
        return queryset.filter(stock_quantity=0)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    search_fields = ["name"]
    pagination_class = None

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsOwner()]

    def get_queryset(self):
        qs = Category.objects.all()
        user = self.request.user
        if not (user.is_authenticated and user.is_owner):
            qs = qs.filter(is_active=True)
        return qs

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Deactivate this category. Products still reference it."},
                status=status.HTTP_409_CONFLICT,
            )


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    search_fields = ["name", "sku", "description"]
    ordering_fields = ["name", "price", "created_at"]
    ordering = ["name"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsOwner()]

    def get_queryset(self):
        qs = Product.objects.select_related("category").prefetch_related("images")
        user = self.request.user
        if not (user.is_authenticated and user.is_owner):
            qs = qs.filter(is_active=True, category__is_active=True)
        return qs

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "This product is on an order. Deactivate it instead."},
                status=status.HTTP_409_CONFLICT,
            )


class ProductImageUploadView(APIView):
    permission_classes = [IsOwner]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        upload = request.FILES.get("image")
        if upload is None:
            return Response(
                {"image": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if upload.size > 5 * 1024 * 1024:
            return Response(
                {"image": ["Images must be 5 MB or smaller."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not validate_uploaded_image(upload):
            return Response(
                {"image": ["Upload a valid PNG, JPEG, or WebP image."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        set_primary = request.data.get("is_primary") in (True, "true", "1", 1)
        has_images = product.images.exists()
        if set_primary:
            product.images.update(is_primary=False)

        image = ProductImage.objects.create(
            product=product,
            image=upload,
            alt_text=request.data.get("alt_text", product.name),
            is_primary=set_primary or not has_images,
        )
        return Response(
            ProductImageSerializer(image, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProductImageDetailView(APIView):
    permission_classes = [IsOwner]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_image(self, product_id, image_id):
        try:
            return ProductImage.objects.select_related("product").get(
                pk=image_id, product_id=product_id
            )
        except ProductImage.DoesNotExist:
            return None

    def patch(self, request, product_id, image_id):
        image = self.get_image(product_id, image_id)
        if image is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        replace = request.FILES.get("image")
        if replace is not None:
            if replace.size > 5 * 1024 * 1024:
                return Response(
                    {"image": ["Images must be 5 MB or smaller."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not validate_uploaded_image(replace):
                return Response(
                    {"image": ["Upload a valid PNG, JPEG, or WebP image."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            image.image.delete(save=False)
            image.image = replace
            image.save(update_fields=["image"])

        serializer = ProductImageUpdateSerializer(
            image, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        image = serializer.save()
        return Response(
            ProductImageSerializer(image, context={"request": request}).data
        )

    def delete(self, request, product_id, image_id):
        image = self.get_image(product_id, image_id)
        if image is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        was_primary = image.is_primary
        product = image.product
        image.image.delete(save=False)
        image.delete()

        if was_primary:
            next_image = product.images.order_by("sort_order", "id").first()
            if next_image:
                next_image.is_primary = True
                next_image.save(update_fields=["is_primary"])

        return Response(status=status.HTTP_204_NO_CONTENT)
