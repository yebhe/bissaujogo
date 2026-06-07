from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation', '0008_contactmessage_reference_reservation'),
    ]

    operations = [
        migrations.AddField(
            model_name='contactmessage',
            name='langue',
            field=models.CharField(choices=[('pt', 'Português'), ('fr', 'Français')], default='pt', max_length=2),
        ),
        migrations.AddField(
            model_name='reservation',
            name='langue',
            field=models.CharField(choices=[('pt', 'Português'), ('fr', 'Français')], default='pt', max_length=2),
        ),
    ]
