from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from core.models import User, MedicineLot, DistributionEvent


class MedicineTrackingTestCase(TestCase):
    def setUp(self):
        self.manufacturer = User.objects.create_user(
            username="pharma_co",
            password="test123",
            role="MANUFACTURER",
            company_name="PharmaTest Inc"
        )

        self.distributor = User.objects.create_user(
            username="distributor_1",
            password="test123",
            role="DISTRIBUTOR",
            company_name="DistCo"
        )

    def test_user_creation_with_roles(self):
        self.assertEqual(self.manufacturer.role, "MANUFACTURER")
        self.assertEqual(self.manufacturer.company_name, "PharmaTest Inc")
        self.assertEqual(str(self.manufacturer), "pharma_co (Manufacturer)")

    def test_medicine_lot_creation(self):
        lot = MedicineLot.objects.create(
            product_name="Paracetamol 500mg",
            product_code="PARA500",
            lot_number="LOT2026001",
            producer=self.manufacturer,
            manufacture_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=730),
            total_quantity=10000,
            remaining_quantity=10000
        )

        self.assertEqual(lot.product_name, "Paracetamol 500mg")
        self.assertEqual(lot.lot_number, "LOT2026001")
        self.assertEqual(lot.remaining_quantity, 10000)
        self.assertIsNone(lot.blockchain_txid)

    def test_distribution_event(self):
        lot = MedicineLot.objects.create(
            product_name="Aspirin 100mg",
            product_code="ASP100",
            lot_number="LOT2026002",
            producer=self.manufacturer,
            manufacture_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=365),
            total_quantity=5000,
            remaining_quantity=5000
        )

        event = DistributionEvent.objects.create(
            lot=lot,
            actor=self.distributor,
            quantity=1000,
            location="Warehouse A"
        )

        self.assertEqual(event.quantity, 1000)
        self.assertEqual(event.location, "Warehouse A")
        self.assertEqual(event.actor, self.distributor)

    def test_lot_uniqueness(self):
        MedicineLot.objects.create(
            product_name="Test Med",
            product_code="TEST001",
            lot_number="UNIQUE001",
            producer=self.manufacturer,
            manufacture_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=365),
            total_quantity=1000,
            remaining_quantity=1000
        )

        with self.assertRaises(Exception):
            MedicineLot.objects.create(
                product_name="Test Med 2",
                product_code="TEST002",
                lot_number="UNIQUE001",
                producer=self.manufacturer,
                manufacture_date=timezone.now().date(),
                expiry_date=timezone.now().date() + timedelta(days=365),
                total_quantity=2000,
                remaining_quantity=2000
            )
