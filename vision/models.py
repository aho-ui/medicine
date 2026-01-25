import uuid
from django.db import models
from core.models import MedicineLot


class VisionInspection(models.Model):
    RESULT_CHOICES = [
        ("GENUINE", "Genuine"),
        ("SUSPICIOUS", "Suspicious"),
        ("COUNTERFEIT", "Counterfeit"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lot = models.ForeignKey(MedicineLot, on_delete=models.CASCADE, related_name="vision_inspections")
    image = models.ImageField(upload_to="inspections/%Y/%m/%d/")
    result = models.CharField(max_length=20, choices=RESULT_CHOICES)
    confidence = models.FloatField()
    bbox = models.JSONField(blank=True, null=True)
    hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lot.lot_number} - {self.result} ({self.confidence:.2%})"

    class Meta:
        ordering = ["-created_at"]


class BlockchainAddress(models.Model):
    image_hash = models.CharField(max_length=64, unique=True, db_index=True)
    verification_id = models.IntegerField()
    tx_hash = models.CharField(max_length=66)
    block_number = models.IntegerField()
    timestamp = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Verification {self.verification_id} - {self.image_hash[:16]}..."

    class Meta:
        ordering = ["-created_at"]
