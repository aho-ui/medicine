import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = [
        ("MANUFACTURER", "Manufacturer"),
        ("DISTRIBUTOR", "Distributor"),
        ("PHARMACY", "Pharmacy"),
        ("CONSUMER", "Consumer"),
        ("ADMIN", "Admin"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    company_name = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class MedicineLot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_name = models.CharField(max_length=255)
    product_code = models.CharField(max_length=100)
    lot_number = models.CharField(max_length=100, unique=True)
    producer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="produced_lots")
    manufacture_date = models.DateField()
    expiry_date = models.DateField()
    total_quantity = models.PositiveIntegerField()
    remaining_quantity = models.PositiveIntegerField()
    blockchain_txid = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product_name} - Lot {self.lot_number}"

    class Meta:
        ordering = ["-created_at"]


class DistributionEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lot = models.ForeignKey(MedicineLot, on_delete=models.CASCADE, related_name="distribution_events")
    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="distribution_actions")
    quantity = models.PositiveIntegerField()
    location = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor.username} - {self.lot.lot_number} ({self.quantity} units)"

    class Meta:
        ordering = ["-timestamp"]


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
        ("VERIFY", "Verify"),
        ("DISTRIBUTE", "Distribute"),
        ("LOGIN", "Login"),
        ("LOGOUT", "Logout"),
        ("REGISTER", "Register"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    username = models.CharField(max_length=150, blank=True)  # Store username even if user is deleted
    task = models.CharField(max_length=100)  # e.g., "MedicineLot", "Verification", "Distribution"
    target_id = models.CharField(max_length=255, blank=True)  # ID of the affected object
    details = models.JSONField(blank=True, null=True)  # Additional context
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} - {self.action} {self.task} at {self.created_at}"

    class Meta:
        ordering = ["-created_at"]
