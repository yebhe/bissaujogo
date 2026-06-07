from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation', '0007_contactmessage'),
    ]

    operations = [
        migrations.AddField(
            model_name='contactmessage',
            name='reference_reservation',
            field=models.CharField(blank=True, max_length=32),
        ),
    ]
