import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import User, MedicineLot, DistributionEvent, AuditLog


MEDICINES = [
    ("Amoxicillin 500mg", "AMX500"),
    ("Ibuprofen 200mg", "IBU200"),
    ("Paracetamol 500mg", "PCM500"),
    ("Metformin 850mg", "MET850"),
    ("Omeprazole 20mg", "OMP020"),
    ("Ciprofloxacin 250mg", "CIP250"),
    ("Azithromycin 500mg", "AZT500"),
    ("Losartan 50mg", "LOS050"),
    ("Atorvastatin 10mg", "ATV010"),
    ("Cetirizine 10mg", "CET010"),
    ("Lisinopril 20mg", "LIS020"),
    ("Amlodipine 5mg", "AML005"),
    ("Doxycycline 100mg", "DOX100"),
    ("Prednisone 10mg", "PRD010"),
    ("Gabapentin 300mg", "GAB300"),
]

COMPANIES = {
    "MANUFACTURER": [
        "PharmaCorp Industries",
        "MediGen Labs",
        "BioSynth Pharmaceuticals",
        "GlobalMed Manufacturing",
        "PureHealth Labs",
    ],
    "DISTRIBUTOR": [
        "MedSupply Logistics",
        "PharmaLink Distribution",
        "HealthBridge Wholesale",
        "QuickMed Supply Co.",
    ],
    "PHARMACY": [
        "CityHealth Pharmacy",
        "WellCare Drugstore",
        "MedPoint Pharmacy",
        "Community Health Rx",
    ],
}

LOCATIONS = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Phoenix, AZ",
    "Philadelphia, PA",
    "San Antonio, TX",
    "San Diego, CA",
    "Dallas, TX",
    "Miami, FL",
]


class Command(BaseCommand):
    help = "Generate test data for users, lots, and distributions"

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=10, help="Number of users to create")
        parser.add_argument("--lots", type=int, default=20, help="Number of lots to create")
        parser.add_argument("--distributions", type=int, default=30, help="Number of distribution events")
        parser.add_argument("--clear", action="store_true", help="Clear existing data before generating")

    def handle(self, *args, **options):
        user_count = options["users"]
        lot_count = options["lots"]
        dist_count = options["distributions"]

        if options["clear"]:
            self.clear_data()

        users = self.create_users(user_count)
        lots = self.create_lots(lot_count, users)
        self.create_distributions(dist_count, lots, users)

        self.stdout.write(self.style.SUCCESS("Done."))

    def clear_data(self):
        DistributionEvent.objects.all().delete()
        MedicineLot.objects.all().delete()
        AuditLog.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write("Cleared existing data.")

    def create_users(self, count):
        roles = ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "CONSUMER", "ADMIN"]
        weights = [3, 2, 2, 2, 1]
        users = []

        # Guarantee at least one admin
        guaranteed = ["ADMIN", "MANUFACTURER"]
        role_list = guaranteed[:min(len(guaranteed), count)]
        role_list += [random.choices(roles, weights=weights, k=1)[0] for _ in range(count - len(role_list))]

        for i, role in enumerate(role_list):
            username = f"{role.lower()}_{i + 1}"

            if User.objects.filter(username=username).exists():
                users.append(User.objects.get(username=username))
                continue

            company = ""
            if role in COMPANIES:
                company = random.choice(COMPANIES[role])

            user = User.objects.create_user(
                username=username,
                password="test1234",
                role=role,
                company_name=company,
            )
            users.append(user)

        self.stdout.write(f"Created {len(users)} users.")
        return users

    def create_lots(self, count, users):
        manufacturers = [u for u in users if u.role == "MANUFACTURER"]
        if not manufacturers:
            manufacturers = list(User.objects.filter(role="MANUFACTURER")[:5])
        if not manufacturers:
            self.stdout.write(self.style.WARNING("No manufacturers found. Skipping lots."))
            return []

        lots = []
        now = timezone.now().date()

        for i in range(count):
            med_name, med_code = random.choice(MEDICINES)
            mfg_date = now - timedelta(days=random.randint(30, 365))
            exp_date = mfg_date + timedelta(days=random.randint(180, 730))
            qty = random.choice([100, 200, 500, 1000, 2000, 5000])
            remaining = random.randint(int(qty * 0.3), qty)
            lot_number = f"LOT-{med_code}-{random.randint(10000, 99999)}"

            lot = MedicineLot.objects.create(
                product_name=med_name,
                product_code=med_code,
                lot_number=lot_number,
                producer=random.choice(manufacturers),
                manufacture_date=mfg_date,
                expiry_date=exp_date,
                total_quantity=qty,
                remaining_quantity=remaining,
            )
            lots.append(lot)

        self.stdout.write(f"Created {len(lots)} lots.")
        return lots

    def create_distributions(self, count, lots, users):
        distributors = [u for u in users if u.role in ("DISTRIBUTOR", "PHARMACY")]
        if not distributors:
            distributors = list(User.objects.filter(role__in=["DISTRIBUTOR", "PHARMACY"])[:5])
        if not distributors or not lots:
            self.stdout.write(self.style.WARNING("No distributors/lots found. Skipping distributions."))
            return

        created = 0
        for _ in range(count):
            lot = random.choice(lots)
            if lot.remaining_quantity <= 0:
                continue

            qty = random.randint(1, min(50, lot.remaining_quantity))
            lot.remaining_quantity -= qty
            lot.save()

            DistributionEvent.objects.create(
                lot=lot,
                actor=random.choice(distributors),
                quantity=qty,
                location=random.choice(LOCATIONS),
            )
            created += 1

        self.stdout.write(f"Created {created} distribution events.")
