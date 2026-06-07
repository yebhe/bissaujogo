from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation', '0006_terrain_photo_imagefield'),
    ]

    operations = [
        migrations.CreateModel(
            name='ContactMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=100)),
                ('prenom', models.CharField(max_length=100)),
                ('email', models.EmailField(max_length=254)),
                ('telephone', models.CharField(blank=True, max_length=30)),
                ('motif', models.CharField(choices=[('annuler_reservation', 'Annuler réservation'), ('modifier_reservation', 'Modifier réservation'), ('autres_infos', 'Autres infos')], default='autres_infos', max_length=40)),
                ('message', models.TextField()),
                ('traite', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
