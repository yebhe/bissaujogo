from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation', '0002_terrain_and_reservation_terrain'),
    ]

    operations = [
        migrations.AddField(
            model_name='terrain',
            name='adresse',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
