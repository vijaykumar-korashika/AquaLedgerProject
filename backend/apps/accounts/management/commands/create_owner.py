from django.core.management.base import BaseCommand

from apps.accounts.models import User


class Command(BaseCommand):
    help = "Create or update the store owner account."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)

    def handle(self, *args, **options):
        email = options["email"].lower().strip()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": email, "role": User.Role.OWNER},
        )
        user.username = email
        user.role = User.Role.OWNER
        user.is_staff = True
        user.is_superuser = True
        user.set_password(options["password"])
        user.save()
        verb = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} owner: {email}"))
