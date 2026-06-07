from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation', '0004_reservation_code_reference'),
    ]

    operations = [
        migrations.AddField(
            model_name='terrain',
            name='photo_url',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='terrain',
            name='prix_reservation',
            field=models.DecimalField(decimal_places=2, default=1200, max_digits=10),
        ),
    ]
