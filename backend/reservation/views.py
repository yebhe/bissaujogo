# views.py
import threading
import traceback
import os
import secrets
from datetime import datetime, timedelta

from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import Q
from django.db.models import Sum
from django.db.models.functions import ExtractYear, ExtractMonth
from django.db.models.deletion import ProtectedError
from django.http import HttpResponse
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Client, Creneau, Reservation, Paiement, Historique, Terrain, ContactMessage

from .serializers import (
    ReservationSerializer, ReservationCreateSerializer,
    ReservationUpdateSerializer, PaiementSurPlaceSerializer,
    TerrainSerializer,
    TerrainAdminUpsertSerializer,
    CreneauSerializer,
    CreneauAdminUpsertSerializer,
    CreneauGenerateSerializer,
    ContactMessageSerializer,
    ContactMessageAdminSerializer,
    HistoriqueSerializer,
)
from .utils.emails import (
    envoyer_confirmation_client,
    envoyer_notification_admin,
    envoyer_contact_message,
    envoyer_notification_statut_client,
)
from .utils.pdf import generer_recu_pdf, generer_rapport_facturation_pdf, generer_reservations_confirmees_jour_pdf


def _get_pagination_params(request, default_page_size=20, max_page_size=100):
    try:
        page = int(request.query_params.get('page', 1))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = int(request.query_params.get('page_size', default_page_size))
    except (TypeError, ValueError):
        page_size = default_page_size

    if page < 1:
        page = 1
    if page_size < 1:
        page_size = default_page_size
    if page_size > max_page_size:
        page_size = max_page_size

    return page, page_size


def _paginate_queryset(qs, page, page_size):
    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size
    return qs[start:end], total


def _run_email_task(label, func, *args):
    try:
        func(*args)
        print(f"[EMAIL OK] {label}")
    except Exception:
        print(f"[EMAIL ERREUR] {label}")
        traceback.print_exc()


def _envoyer_recu_client_admin(reservation, notifier_admin=True):
    threading.Thread(
        target=_run_email_task,
        args=('confirmation client', envoyer_confirmation_client, reservation),
        daemon=True,
    ).start()
    if not notifier_admin:
        return
    threading.Thread(
        target=_run_email_task,
        args=('notification admin', envoyer_notification_admin, reservation),
        daemon=True,
    ).start()


def _envoyer_notification_statut_client(reservation, type_notification, details=''):
    threading.Thread(
        target=envoyer_notification_statut_client,
        args=(reservation, type_notification, details),
        daemon=True,
    ).start()


# ── Contact (public) ─────────────────────────────────────────────────────────

class ContactView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        ContactMessage.objects.create(**serializer.validated_data)
        envoyer_contact_message(serializer.validated_data)
        return Response({'ok': True})


class AdminContactMessagesView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = ContactMessage.objects.all()
        search = (request.query_params.get('search') or '').strip()
        traite = request.query_params.get('traite')
        motif = (request.query_params.get('motif') or '').strip()

        if search:
            qs = qs.filter(
                Q(nom__icontains=search) |
                Q(prenom__icontains=search) |
                Q(email__icontains=search) |
                Q(telephone__icontains=search) |
                Q(message__icontains=search)
            )
        if traite in ['true', 'false']:
            qs = qs.filter(traite=(traite == 'true'))
        if motif:
            qs = qs.filter(motif=motif)

        page, page_size = _get_pagination_params(request, default_page_size=20)
        page_qs, total = _paginate_queryset(qs, page, page_size)

        return Response({
            'results': ContactMessageAdminSerializer(page_qs, many=True).data,
            'count': total,
            'page': page,
            'page_size': page_size,
        })


class AdminContactMessageDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        message = get_object_or_404(ContactMessage, pk=pk)
        if 'traite' in request.data:
            message.traite = bool(request.data.get('traite'))
            message.save(update_fields=['traite'])
        return Response(ContactMessageAdminSerializer(message).data)

    def delete(self, request, pk):
        message = get_object_or_404(ContactMessage, pk=pk)
        message.delete()
        return Response(status=204)


# ── Terrains (public) ─────────────────────────────────────────────────────────

class TerrainsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        terrains = Terrain.objects.filter(actif=True)
        return Response(TerrainSerializer(terrains, many=True, context={'request': request}).data)


# ── Terrains (admin) ──────────────────────────────────────────────────────────

class AdminTerrainsView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Terrain.objects.all().order_by('nom')
        search = (request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(nom__icontains=search)

        page, page_size = _get_pagination_params(request, default_page_size=20)
        page_qs, total = _paginate_queryset(qs, page, page_size)

        return Response({
            'results': TerrainSerializer(page_qs, many=True, context={'request': request}).data,
            'count': total,
            'page': page,
            'page_size': page_size,
        })

    def post(self, request):
        serializer = TerrainAdminUpsertSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        terrain = serializer.save()
        return Response(TerrainSerializer(terrain, context={'request': request}).data, status=201)


class AdminTerrainDetailView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        terrain = get_object_or_404(Terrain, pk=pk)
        serializer = TerrainAdminUpsertSerializer(instance=terrain, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        terrain = serializer.save()
        return Response(TerrainSerializer(terrain, context={'request': request}).data)

    def delete(self, request, pk):
        terrain = get_object_or_404(Terrain, pk=pk)
        if Reservation.objects.filter(terrain=terrain).exists():
            return Response(
                {'error': "Impossible de supprimer ce terrain : il est déjà utilisé par une réservation."},
                status=400,
            )
        try:
            terrain.delete()
        except ProtectedError:
            return Response(
                {'error': "Impossible de supprimer ce terrain : il est déjà utilisé par une réservation."},
                status=400,
            )

        return Response(status=204)


# ── Créneaux (admin) ──────────────────────────────────────────────────────────

class AdminCreneauxView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Creneau.objects.all().order_by('heure_debut')
        search = (request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(heure_debut__startswith=search) |
                Q(heure_fin__startswith=search)
            )

        page, page_size = _get_pagination_params(request, default_page_size=50)
        page_qs, total = _paginate_queryset(qs, page, page_size)

        return Response({
            'results': CreneauSerializer(page_qs, many=True).data,
            'count': total,
            'page': page,
            'page_size': page_size,
        })

    def post(self, request):
        serializer = CreneauAdminUpsertSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        creneau = serializer.save()
        return Response(CreneauSerializer(creneau).data, status=201)


class AdminCreneauDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        creneau = get_object_or_404(Creneau, pk=pk)
        if any(field in request.data for field in ['heure_debut', 'heure_fin']) and Reservation.objects.filter(creneau=creneau).exists():
            return Response(
                {'error': "Impossible de modifier les heures de ce créneau : il est déjà utilisé par une réservation."},
                status=400,
            )
        serializer = CreneauAdminUpsertSerializer(instance=creneau, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        creneau = serializer.save()
        return Response(CreneauSerializer(creneau).data)

    def delete(self, request, pk):
        creneau = get_object_or_404(Creneau, pk=pk)
        if Reservation.objects.filter(creneau=creneau).exists():
            return Response(
                {'error': "Impossible de supprimer ce créneau : il est déjà utilisé par une réservation."},
                status=400,
            )
        try:
            creneau.delete()
        except ProtectedError:
            return Response(
                {'error': "Impossible de supprimer ce créneau : il est déjà utilisé par une réservation."},
                status=400,
            )

        return Response(status=204)


class AdminCreneauxGenerateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = CreneauGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        duree = int(data['duree_min'])

        base = datetime(2000, 1, 1)
        start_dt = datetime.combine(base.date(), data['heure_debut'])
        end_dt = datetime.combine(base.date(), data['heure_fin'])

        created = 0
        updated = 0
        current = start_dt
        while current + timedelta(minutes=duree) <= end_dt:
            h1 = current.time()
            h2 = (current + timedelta(minutes=duree)).time()

            obj, was_created = Creneau.objects.get_or_create(
                heure_debut=h1,
                heure_fin=h2,
                defaults={'actif': True},
            )
            if was_created:
                created += 1
            else:
                if not obj.actif:
                    obj.actif = True
                    obj.save(update_fields=['actif'])
                    updated += 1

            current = current + timedelta(minutes=duree)

        return Response({'created': created, 'reactivated': updated})


# ── Créneaux disponibles ───────────────────────────────────────────────────────

class CreneauxDisponiblesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        date = request.query_params.get('date')
        terrain_id = request.query_params.get('terrain_id')
        if not date:
            return Response({'error': 'Paramètre date requis.'}, status=400)
        if not terrain_id:
            return Response({'error': 'Paramètre terrain_id requis.'}, status=400)

        if not Terrain.objects.filter(id=terrain_id, actif=True).exists():
            return Response({'error': 'Terrain introuvable.'}, status=404)

        creneaux = Creneau.objects.filter(actif=True)
        reserves = set(
            Reservation.objects.filter(
                date_reservation=date,
                terrain_id=terrain_id,
                statut__in=['en_attente', 'confirmee'],
            ).values_list('creneau_id', flat=True)
        )

        return Response([
            {
                'id':          c.id,
                'heure_debut': str(c.heure_debut),
                'heure_fin':   str(c.heure_fin),
                'disponible':  c.id not in reserves,
                'terrain_id':  terrain_id,
            }
            for c in creneaux
        ])


# ── Création de réservation (public) ──────────────────────────────────────────

class ReservationCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ReservationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        client, created = Client.objects.get_or_create(
            telephone=data['telephone'],
            defaults={
                'nom':    data['nom'],
                'prenom': data['prenom'],
                'email':  data['email'],
            },
        )
        if not created:
            updated_fields = []
            for field in ('nom', 'prenom', 'email'):
                if getattr(client, field) != data[field]:
                    setattr(client, field, data[field])
                    updated_fields.append(field)
            if updated_fields:
                client.save(update_fields=updated_fields)

        terrain = get_object_or_404(Terrain, pk=data['terrain_id'], actif=True)
        reservation = Reservation.objects.create(
            client=client,
            terrain=terrain,
            creneau_id=data['creneau_id'],
            date_reservation=data['date_reservation'],
            montant=terrain.prix_reservation,
            langue=data.get('langue', 'pt'),
        )

        Historique.objects.create(reservation=reservation, action='creee')

        Paiement.objects.create(
            reservation=reservation,
            montant=reservation.montant,
            methode=data['methode_paiement'],
        )

        _envoyer_recu_client_admin(reservation)

        reservation.refresh_from_db()
        return Response(ReservationSerializer(reservation, context={'request': request}).data, status=201)


class AdminReservationPaiementManuelView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        payload = {
            **request.data,
            'methode_paiement': 'especes',
        }
        serializer = ReservationCreateSerializer(data=payload)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        client, created = Client.objects.get_or_create(
            telephone=data['telephone'],
            defaults={
                'nom': data['nom'],
                'prenom': data['prenom'],
                'email': data['email'],
            },
        )
        if not created:
            updated_fields = []
            for field in ('nom', 'prenom', 'email'):
                if getattr(client, field) != data[field]:
                    setattr(client, field, data[field])
                    updated_fields.append(field)
            if updated_fields:
                client.save(update_fields=updated_fields)

        terrain = get_object_or_404(Terrain, pk=data['terrain_id'], actif=True)
        reservation = Reservation.objects.create(
            client=client,
            terrain=terrain,
            creneau_id=data['creneau_id'],
            date_reservation=data['date_reservation'],
            montant=terrain.prix_reservation,
            langue=data.get('langue', 'fr'),
        )

        Historique.objects.create(
            reservation=reservation,
            action='creee',
            details='Réservation créée manuellement avec paiement sur place',
        )

        paiement = Paiement.objects.create(
            reservation=reservation,
            montant=reservation.montant,
            methode='especes',
        )
        paiement.marquer_paye()
        reservation.confirmer(details='Confirmée après paiement manuel sur place')

        reservation.refresh_from_db()
        _envoyer_notification_statut_client(reservation, 'paiement')
        _envoyer_recu_client_admin(reservation, notifier_admin=False)
        return Response(ReservationSerializer(reservation, context={'request': request}).data, status=201)


# ── Paiement en ligne (stub Orange Money) ─────────────────────────────────────

class PaiementEnLigneInitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        # ... (rest of the code remains the same)
        reservation = get_object_or_404(
            Reservation.objects.select_related('client', 'terrain', 'creneau').prefetch_related('paiement'),
            pk=pk,
        )

        paiement = getattr(reservation, 'paiement', None)
        if not paiement:
            return Response({'error': 'Paiement introuvable.'}, status=404)

        if paiement.methode != 'en_ligne':
            return Response({'error': "Cette réservation n'est pas en paiement en ligne."}, status=400)

        if paiement.statut == 'paye':
            return Response({'error': 'Paiement déjà effectué.'}, status=400)

        if not paiement.reference:
            paiement.reference = f"OM-{secrets.token_hex(8).upper()}"
            paiement.save(update_fields=['reference'])

        return Response({
            'reservation_id': reservation.id,
            'reference': paiement.reference,
            'montant': str(paiement.montant),
        })


class PaiementEnLigneWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        secret = os.getenv('PAYMENT_WEBHOOK_SECRET', '')
        provided = request.headers.get('X-Payment-Secret', '')
        if not secret or provided != secret:
            return Response({'error': 'Accès refusé.'}, status=403)

        reference = request.data.get('reference')
        status_ = request.data.get('status')

        if not reference or status_ not in ('success', 'failed'):
            return Response({'error': 'Payload invalide.'}, status=400)

        paiement = get_object_or_404(Paiement.objects.select_related('reservation'), reference=reference)

        if status_ == 'failed':
            paiement.statut = 'echoue'
            paiement.save(update_fields=['statut'])
            Historique.objects.create(
                reservation=paiement.reservation,
                action='paiement',
                details='Paiement en ligne échoué',
            )
            _envoyer_notification_statut_client(
                paiement.reservation,
                'paiement',
                "Le paiement en ligne n'a pas abouti. Vous pouvez contacter l'équipe BissauJogo pour plus d'informations.",
            )
            return Response({'ok': True})

        if paiement.statut != 'paye':
            paiement.marquer_paye()
            _envoyer_notification_statut_client(paiement.reservation, 'paiement')
            _envoyer_recu_client_admin(paiement.reservation, notifier_admin=False)

        return Response({'ok': True})


# ── Liste des réservations (admin) ────────────────────────────────────────────

class ReservationListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = (
            Reservation.objects
            .select_related('client', 'terrain', 'creneau')
            .prefetch_related('paiement', 'historique')
        )

        statut = request.query_params.get('statut')
        date = request.query_params.get('date')
        if statut:
            qs = qs.filter(statut=statut)
        if date:
            qs = qs.filter(date_reservation=date)

        search = (request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(code_reference__icontains=search) |
                Q(client__nom__icontains=search) |
                Q(client__prenom__icontains=search) |
                Q(client__telephone__icontains=search) |
                Q(client__email__icontains=search) |
                Q(terrain__nom__icontains=search) |
                Q(paiement__reference__icontains=search)
            )

        qs = qs.order_by('-created_at', '-id')

        page, page_size = _get_pagination_params(request, default_page_size=7)
        page_qs, total = _paginate_queryset(qs, page, page_size)

        return Response({
            'results': ReservationSerializer(page_qs, many=True, context={'request': request}).data,
            'count': total,
            'page': page,
            'page_size': page_size,
        })


# ── Détail / modification d'une réservation (admin) ───────────────────────────

class ReservationDetailView(APIView):
    permission_classes = [IsAdminUser]

    def _get_reservation(self, pk):
        return get_object_or_404(
            Reservation.objects
            .select_related('client', 'terrain', 'creneau')
            .prefetch_related('paiement', 'historique'),
            pk=pk,
        )

    def get(self, request, pk):
        reservation = self._get_reservation(pk)

        # Pagination de l'historique (optionnel)
        try:
            hist_page = int(request.query_params.get('historique_page', 1))
        except (TypeError, ValueError):
            hist_page = 1
        try:
            hist_page_size = int(request.query_params.get('historique_page_size', 7))
        except (TypeError, ValueError):
            hist_page_size = 7

        if hist_page < 1:
            hist_page = 1
        if hist_page_size < 1:
            hist_page_size = 7
        if hist_page_size > 100:
            hist_page_size = 100

        hist_qs = reservation.historique.all().order_by('-date_action', '-id')
        hist_page_qs, hist_total = _paginate_queryset(hist_qs, hist_page, hist_page_size)

        data = ReservationSerializer(reservation, context={'request': request}).data
        data['historique'] = HistoriqueSerializer(hist_page_qs, many=True).data
        data['historique_pagination'] = {
            'count': hist_total,
            'page': hist_page,
            'page_size': hist_page_size,
        }
        return Response(data)

    def patch(self, request, pk):
        reservation = self._get_reservation(pk)
        serializer  = ReservationUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        # ── Changement de statut ──────────────────────────────────────────────
        nouveau_statut = data.get('statut')
        envoyer_recu = False
        notification_client = None
        notification_details = ''
        if nouveau_statut and nouveau_statut != reservation.statut:
            if nouveau_statut == 'confirmee':
                reservation.confirmer(details='Confirmée manuellement par admin')
                envoyer_recu = True
                notification_client = 'confirmee'
            elif nouveau_statut == 'annulee':
                reservation.annuler(details='Annulée manuellement par admin')
                notification_client = 'annulee'
                notification_details = "La réservation a été annulée par l'administration."
            elif nouveau_statut == 'terminee':
                reservation.terminer()
                notification_client = 'terminee'
            else:
                # en_attente — retour manuel (rare)
                reservation.statut = nouveau_statut
                reservation.save(update_fields=['statut', 'updated_at'])
                Historique.objects.create(
                    reservation=reservation,
                    action='modifiee',
                    details=f"Statut remis à '{reservation.get_statut_display()}' par admin",
                )

        # ── Champs simples ─────────────────────────────────────────────────────
        simple_fields = []
        if 'note' in data:
            reservation.note = data['note']
            simple_fields.append('note')
        if 'montant' in data:
            reservation.montant = data['montant']
            simple_fields.append('montant')
        if simple_fields:
            simple_fields.append('updated_at')
            reservation.save(update_fields=simple_fields)

        # ── Date / terrain / créneau ────────────────────────────────────────────
        date_ou_terrain_ou_creneau_change = 'date_reservation' in data or 'terrain_id' in data or 'creneau_id' in data
        if date_ou_terrain_ou_creneau_change:
            nouvelle_date = data.get('date_reservation', reservation.date_reservation)
            nouveau_terrain_id = data.get('terrain_id', reservation.terrain_id)
            nouveau_creneau_id = data.get('creneau_id', reservation.creneau_id)
            deja = Reservation.objects.filter(
                terrain_id=nouveau_terrain_id,
                creneau_id=nouveau_creneau_id,
                date_reservation=nouvelle_date,
                statut__in=['en_attente', 'confirmee'],
            ).exclude(pk=reservation.pk).exists()
            if deja:
                return Response(
                    {'error': "Impossible de déplacer cette réservation : ce terrain et ce créneau sont déjà pris à cette date."},
                    status=400,
                )
            if 'date_reservation' in data:
                reservation.date_reservation = data['date_reservation']

            if 'terrain_id' in data:
                reservation.terrain_id = data['terrain_id']
                if 'montant' not in data:
                    terrain = get_object_or_404(Terrain, pk=data['terrain_id'], actif=True)
                    reservation.montant = terrain.prix_reservation
            if 'creneau_id' in data:
                reservation.creneau_id = data['creneau_id']
            update_fields = ['updated_at']
            if 'date_reservation' in data:
                update_fields.append('date_reservation')
            if 'terrain_id' in data:
                update_fields.append('terrain_id')
                if 'montant' not in data:
                    update_fields.append('montant')
            if 'creneau_id' in data:
                update_fields.append('creneau_id')
            reservation.save(update_fields=update_fields)
            Historique.objects.create(
                reservation=reservation,
                action='modifiee',
                details='Date/terrain/créneau modifié par admin',
            )
            notification_client = 'deplacee'
            notification_details = 'Date, terrain ou créneau déplacé par l’administration.'

        if 'montant' in data or ('terrain_id' in data and 'montant' not in data):
            paiement = getattr(reservation, 'paiement', None)
            if paiement:
                paiement.montant = reservation.montant
                paiement.save(update_fields=['montant'])

        if envoyer_recu:
            _envoyer_recu_client_admin(reservation, notifier_admin=False)
        if notification_client:
            _envoyer_notification_statut_client(reservation, notification_client, notification_details)

        reservation.refresh_from_db()
        return Response(ReservationSerializer(reservation, context={'request': request}).data)


# ── Facturation (admin) ───────────────────────────────────────────────────────

class AdminFacturationView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # filtres
        try:
            year = int(request.query_params.get('year', datetime.utcnow().year))
        except (TypeError, ValueError):
            year = datetime.utcnow().year

        month_raw = request.query_params.get('month')
        month = None
        if month_raw not in (None, ''):
            try:
                month = int(month_raw)
            except (TypeError, ValueError):
                month = None
        if month is not None and (month < 1 or month > 12):
            month = None

        qs = (
            Paiement.objects
            .select_related('reservation', 'reservation__client', 'reservation__terrain', 'reservation__creneau')
            .filter(statut='paye')
            .annotate(y=ExtractYear('date_paiement'), m=ExtractMonth('date_paiement'))
            .filter(y=year)
        )

        if month is not None:
            qs = qs.filter(m=month)

        qs = qs.order_by('-date_paiement', '-id')

        # stats par mois pour l'année
        year_qs = (
            Paiement.objects
            .filter(statut='paye')
            .annotate(y=ExtractYear('date_paiement'), m=ExtractMonth('date_paiement'))
            .filter(y=year)
        )
        per_month = {
            row['m']: row['total']
            for row in year_qs.values('m').annotate(total=Sum('montant')).order_by('m')
        }
        year_total = year_qs.aggregate(total=Sum('montant'))['total'] or 0

        # pagination liste
        page, page_size = _get_pagination_params(request, default_page_size=7)
        page_qs, total = _paginate_queryset(qs, page, page_size)

        results = []
        for p in page_qs:
            r = p.reservation
            results.append({
                'reservation_id': r.id,
                'date_paiement': p.date_paiement.isoformat() if p.date_paiement else None,
                'montant': str(p.montant),
                'methode': p.methode,
                'methode_display': p.get_methode_display(),
                'client': {
                    'nom': r.client.nom,
                    'prenom': r.client.prenom,
                    'telephone': r.client.telephone,
                    'email': r.client.email,
                },
                'terrain': {
                    'id': r.terrain.id,
                    'nom': r.terrain.nom,
                },
                'date_reservation': str(r.date_reservation),
            })

        return Response({
            'year': year,
            'month': month,
            'stats': {
                'year_total': str(year_total),
                'by_month': [
                    {'month': m, 'total': str(per_month.get(m, 0) or 0)}
                    for m in range(1, 13)
                ],
            },
            'results': results,
            'count': total,
            'page': page,
            'page_size': page_size,
        })


class AdminFacturationReportPdfView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            year = int(request.query_params.get('year', datetime.utcnow().year))
        except (TypeError, ValueError):
            year = datetime.utcnow().year

        month_raw = request.query_params.get('month')
        month = None
        if month_raw not in (None, ''):
            try:
                month = int(month_raw)
            except (TypeError, ValueError):
                month = None
        if month is not None and (month < 1 or month > 12):
            month = None

        paid = Paiement.objects.filter(statut='paye').exclude(date_paiement__isnull=True)

        if month is not None:
            qs = (
                paid
                .annotate(y=ExtractYear('date_paiement'), m=ExtractMonth('date_paiement'))
                .filter(y=year, m=month)
            )
            total = qs.aggregate(total=Sum('montant'))['total'] or 0
            titre = 'Rapport mensuel'
            sous_titre = f"Période: {month:02d}/{year}"
            lignes = [(f"{month:02d}/{year}", f"{total} XOF")]
            total_str = f"{total} XOF"
            filename = f"rapport_facturation_{year}_{month:02d}.pdf"
        else:
            qs = (
                paid
                .annotate(y=ExtractYear('date_paiement'), m=ExtractMonth('date_paiement'))
                .filter(y=year)
            )
            per_month = {
                row['m']: row['total']
                for row in qs.values('m').annotate(total=Sum('montant')).order_by('m')
            }
            total = qs.aggregate(total=Sum('montant'))['total'] or 0
            titre = 'Rapport annuel'
            sous_titre = f"Année: {year}"
            lignes = [
                (f"{m:02d}/{year}", f"{per_month.get(m, 0) or 0} XOF")
                for m in range(1, 13)
            ]
            total_str = f"{total} XOF"
            filename = f"rapport_facturation_{year}.pdf"

        pdf_bytes = generer_rapport_facturation_pdf(
            titre=titre,
            sous_titre=sous_titre,
            lignes=lignes,
            total=total_str,
        )

        resp = HttpResponse(pdf_bytes, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="{filename}"'
        return resp


class AdminReservationRecuPdfView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        reservation = get_object_or_404(
            Reservation.objects.select_related('client', 'terrain', 'creneau').prefetch_related('paiement'),
            pk=pk,
        )
        pdf_bytes = generer_recu_pdf(reservation)
        resp = HttpResponse(pdf_bytes, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="recu_bissaujogo_{reservation.id}.pdf"'
        return resp


class AdminReservationsConfirmeesJourPdfView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()
        reservations = list(
            Reservation.objects
            .select_related('client', 'terrain', 'creneau', 'paiement')
            .filter(date_reservation=today, statut='confirmee')
            .order_by('creneau__heure_debut', 'terrain__nom', 'id')
        )
        pdf_bytes = generer_reservations_confirmees_jour_pdf(reservations, today)
        resp = HttpResponse(pdf_bytes, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="reservations_confirmees_{today:%Y_%m_%d}.pdf"'
        return resp


# ── Encaissement sur place (admin) ────────────────────────────────────────────

class PaiementSurPlaceView(APIView):
    """Admin — enregistre un paiement reçu physiquement."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        reservation = get_object_or_404(
            Reservation.objects.select_related('client', 'terrain', 'creneau')
            .prefetch_related('historique'),
            pk=pk,
        )

        # On n'encaisse pas une réservation déjà annulée ou terminée
        if reservation.statut in ('annulee', 'terminee'):
            return Response(
                {'error': f"Impossible d'encaisser une réservation '{reservation.get_statut_display()}'."},
                status=400,
            )

        serializer = PaiementSurPlaceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data

        paiement, _ = Paiement.objects.get_or_create(
            reservation=reservation,
            defaults={'montant': reservation.montant, 'methode': data['methode']},
        )

        # Si le paiement est déjà marqué payé, on ne le retraite pas
        if paiement.statut == 'paye':
            return Response(
                {'error': 'Ce paiement est déjà enregistré comme payé.'},
                status=400,
            )

        paiement.methode   = data['methode']
        paiement.reference = data.get('reference', '')
        paiement.save(update_fields=['methode', 'reference'])

        # marquer_paye() crée l'historique paiement ; ne confirme PAS auto (méthode ≠ en_ligne)
        paiement.marquer_paye()

        # Confirmation automatique de la réservation après paiement
        if reservation.statut != 'confirmee':
            reservation.confirmer(
                details=f"Confirmée après paiement {paiement.get_methode_display()}",
            )

        reservation.refresh_from_db()
        _envoyer_notification_statut_client(reservation, 'paiement')
        _envoyer_recu_client_admin(reservation, notifier_admin=False)
        return Response(ReservationSerializer(reservation, context={'request': request}).data)


class PaiementNonPayeView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        reservation = get_object_or_404(
            Reservation.objects.select_related('client', 'terrain', 'creneau'),
            pk=pk,
        )
        paiement = getattr(reservation, 'paiement', None)
        if not paiement:
            return Response({'error': 'Aucun paiement à marquer comme non payé.'}, status=404)
        if paiement.statut != 'paye':
            return Response({'error': "Ce paiement n'est pas marqué comme payé."}, status=400)

        paiement.marquer_non_paye()
        reservation.refresh_from_db()
        return Response(ReservationSerializer(reservation, context={'request': request}).data)


class AdminReservationEmailTestView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        reservation = get_object_or_404(
            Reservation.objects.select_related('client'),
            pk=pk,
        )
        email_client = (reservation.client.email or '').strip()
        if not email_client:
            return Response({'error': 'Email client manquant.'}, status=400)

        count = send_mail(
            subject='Test email BissauJogo',
            message='Ceci est un test email BissauJogo.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email_client],
            fail_silently=False,
        )
        return Response({'sent': count, 'to': email_client})