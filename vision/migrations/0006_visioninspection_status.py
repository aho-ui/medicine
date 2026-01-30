from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vision', '0005_visioninspection_image_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='visioninspection',
            name='status',
            field=models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')], default='PENDING', max_length=20),
        ),
    ]
