from rest_framework import serializers

from apps.catalog.models import Category, Product, ProductImage
from apps.catalog.utils import unique_slug


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "is_active"]
        read_only_fields = ["slug"]

    def create(self, validated_data):
        validated_data["slug"] = unique_slug(Category, validated_data["name"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "name" in validated_data and validated_data["name"] != instance.name:
            validated_data["slug"] = unique_slug(
                Category, validated_data["name"], instance=instance
            )
        return super().update(instance, validated_data)


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt_text", "is_primary", "sort_order"]

    def get_url(self, obj):
        if not obj.image:
            return None
        # Relative /media/... works with Vite proxy and production nginx.
        return obj.image.url


class ProductImageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["alt_text", "is_primary", "sort_order"]

    def update(self, instance, validated_data):
        product = instance.product
        if validated_data.get("is_primary"):
            ProductImage.objects.filter(product=product).exclude(pk=instance.pk).update(
                is_primary=False
            )
        return super().update(instance, validated_data)


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    images = serializers.SerializerMethodField()
    in_stock = serializers.BooleanField(read_only=True)

    def get_images(self, obj):
        qs = obj.images.all().order_by("-is_primary", "sort_order", "id")
        return ProductImageSerializer(
            qs, many=True, context=self.context
        ).data

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "slug",
            "sku",
            "description",
            "price",
            "stock_quantity",
            "low_stock_threshold",
            "is_active",
            "in_stock",
            "images",
        ]
        read_only_fields = ["slug"]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_sku(self, value):
        return value.strip().upper()

    def create(self, validated_data):
        validated_data["slug"] = unique_slug(Product, validated_data["name"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "name" in validated_data and validated_data["name"] != instance.name:
            validated_data["slug"] = unique_slug(
                Product, validated_data["name"], instance=instance
            )
        return super().update(instance, validated_data)
