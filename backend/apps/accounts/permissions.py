from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    message = "Owner access is required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_owner)


class IsCustomer(BasePermission):
    message = "Only customers can use the cart and place orders."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and user.role == "customer"
        )
