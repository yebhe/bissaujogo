from django.contrib import admin
from .models import Reservation, Paiement, Client, Creneau, Historique, Terrain, ContactMessage

# Register your models here.
admin.site.site_header = "Admin Réservation de Terrain"
admin.site.site_title = "Admin Réservation de Terrain"
admin.site.index_title = "Admin Réservation de Terrain"

admin.site.register(Reservation)
admin.site.register(Paiement)
admin.site.register(Client)
admin.site.register(Terrain)
admin.site.register(Creneau)
admin.site.register(Historique)
admin.site.register(ContactMessage)