# urls.py
from django.urls import path
from .views import (
    TerrainsView,
    CreneauxDisponiblesView, ReservationCreateView,
    PaiementEnLigneInitView, PaiementEnLigneWebhookView,
    ContactView,
    AdminContactMessagesView, AdminContactMessageDetailView,
    AdminTerrainsView, AdminTerrainDetailView,
    AdminCreneauxView, AdminCreneauDetailView, AdminCreneauxGenerateView,
    ReservationListView, ReservationDetailView, PaiementSurPlaceView, PaiementNonPayeView, AdminReservationPaiementManuelView,
    AdminFacturationView, AdminReservationRecuPdfView, AdminFacturationReportPdfView,
    AdminReservationsConfirmeesJourPdfView, AdminReservationEmailTestView,
)

urlpatterns = [
    path('terrains/',                    TerrainsView.as_view()),
    path('creneaux/',                    CreneauxDisponiblesView.as_view()),
    path('reservations/',                ReservationCreateView.as_view()),
    path('contact/',                     ContactView.as_view()),

    path('reservations/<int:pk>/paiement/init/', PaiementEnLigneInitView.as_view()),
    path('paiements/webhook/',            PaiementEnLigneWebhookView.as_view()),

    path('admin/terrains/',               AdminTerrainsView.as_view()),
    path('admin/contact-messages/',       AdminContactMessagesView.as_view()),
    path('admin/contact-messages/<int:pk>/', AdminContactMessageDetailView.as_view()),
    path('admin/terrains/<int:pk>/',      AdminTerrainDetailView.as_view()),

    path('admin/creneaux/',               AdminCreneauxView.as_view()),
    path('admin/creneaux/<int:pk>/',      AdminCreneauDetailView.as_view()),
    path('admin/creneaux/generate/',      AdminCreneauxGenerateView.as_view()),

    path('admin/reservations/',          ReservationListView.as_view()),
    path('admin/reservations/paiement-manuel/', AdminReservationPaiementManuelView.as_view()),
    path('admin/reservations/<int:pk>/', ReservationDetailView.as_view()),
    path('admin/reservations/<int:pk>/paiement/', PaiementSurPlaceView.as_view()),
    path('admin/reservations/<int:pk>/paiement/non-paye/', PaiementNonPayeView.as_view()),
    path('admin/reservations/<int:pk>/email-test/', AdminReservationEmailTestView.as_view()),
    path('admin/reservations/<int:pk>/recu/', AdminReservationRecuPdfView.as_view(), name='admin_reservation_recu_pdf'),
    path('admin/reservations/confirmations-du-jour/pdf/', AdminReservationsConfirmeesJourPdfView.as_view(), name='admin_reservations_confirmees_jour_pdf'),
    path('admin/facturation/',           AdminFacturationView.as_view(), name='admin_facturation'),
    path('admin/facturation/rapport/',   AdminFacturationReportPdfView.as_view(), name='admin_facturation_report_pdf'),
]