from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.accounts.models import User


@receiver(post_save, sender=User)
def ensure_customer_cart(sender, instance, created, **kwargs):
    if created and instance.role == User.Role.CUSTOMER:
        from apps.orders.models import Cart

        Cart.objects.get_or_create(user=instance)
