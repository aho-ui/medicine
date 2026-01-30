from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = "core"

    def ready(self):
        from django.db import OperationalError, ProgrammingError
        from .models import User
        try:
            if not User.objects.filter(role="ADMIN").exists():
                User.objects.create_user(
                    username="admin",
                    email="admin@medverify.local",
                    password="admin",
                    role="ADMIN",
                    company_name="MedVerifyChain",
                )
                print("Created default admin user")
        except (OperationalError, ProgrammingError):
            pass
