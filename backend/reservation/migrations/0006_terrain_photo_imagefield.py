from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservation', '0005_terrain_photo_prix'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='terrain',
            name='photo_url',
        ),
        migrations.AddField(
            model_name='terrain',
            name='photo',
            field=models.ImageField(blank=True, null=True, upload_to='terrains/'),
        ),
    ]
