# serializers.py
from rest_framework import serializers
from .models import Reservation, Paiement, Client, Creneau, Historique, Terrain, ContactMessage

from datetime import date, timedelta
from django.urls import reverse


class TerrainSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Terrain
        fields = ['id', 'nom', 'adresse', 'photo_url', 'prix_reservation', 'actif']

    def get_photo_url(self, obj):
        if not getattr(obj, 'photo', None):
            return ''
        try:
            url = obj.photo.url
        except Exception:
            return ''
        return url


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Client
        fields = ['id', 'nom', 'prenom', 'telephone', 'email']


class CreneauSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Creneau
        fields = ['id', 'heure_debut', 'heure_fin', 'actif']


class TerrainAdminUpsertSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(required=False, allow_null=True)
    remove_photo = serializers.BooleanField(required=False, write_only=True, default=False)

    class Meta:
        model = Terrain
        fields = ['nom', 'adresse', 'photo', 'remove_photo', 'prix_reservation', 'actif']

    def create(self, validated_data):
        validated_data.pop('remove_photo', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        remove_photo = validated_data.pop('remove_photo', False)
        old_photo = instance.photo
        new_photo = validated_data.get('photo')
        if remove_photo:
            instance.photo = None
        instance = super().update(instance, validated_data)
        if old_photo and (remove_photo or (new_photo and old_photo.name != instance.photo.name)):
            old_photo.delete(save=False)
        return instance


class CreneauAdminUpsertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creneau
        fields = ['heure_debut', 'heure_fin', 'actif']


class CreneauGenerateSerializer(serializers.Serializer):
    heure_debut = serializers.TimeField()
    heure_fin   = serializers.TimeField()
    duree_min   = serializers.IntegerField(default=60, min_value=30, max_value=720)

    def validate(self, data):
        if data['heure_fin'] <= data['heure_debut']:
            raise serializers.ValidationError({'heure_fin': "L'heure de fin doit être après l'heure de début."})
        return data


class HistoriqueSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model  = Historique
        fields = ['id', 'action', 'action_display', 'details', 'date_action']


class PaiementSerializer(serializers.ModelSerializer):
    methode_display = serializers.CharField(source='get_methode_display', read_only=True)
    statut_display  = serializers.CharField(source='get_statut_display',  read_only=True)

    class Meta:
        model  = Paiement
        fields = ['id', 'montant', 'methode', 'methode_display',
                  'statut', 'statut_display', 'reference', 'date_paiement']


class ReservationSerializer(serializers.ModelSerializer):
    client         = ClientSerializer(read_only=True)
    terrain        = TerrainSerializer(read_only=True)
    creneau        = CreneauSerializer(read_only=True)
    paiement       = PaiementSerializer(read_only=True)
    historique     = HistoriqueSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    recu_pdf_url    = serializers.SerializerMethodField()

    class Meta:
        model  = Reservation
        fields = ['id', 'code_reference', 'client', 'terrain', 'creneau', 'date_reservation', 'statut',
                  'statut_display', 'montant', 'note', 'langue', 'paiement',
                  'historique', 'created_at', 'updated_at', 'recu_pdf_url']

    def get_recu_pdf_url(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        url = reverse('admin_reservation_recu_pdf', kwargs={'pk': obj.pk})
        if request is None:
            return url
        return request.build_absolute_uri(url)


class ReservationCreateSerializer(serializers.Serializer):
    nom              = serializers.CharField(max_length=100)
    prenom           = serializers.CharField(max_length=100)
    telephone        = serializers.CharField(max_length=20)
    email            = serializers.EmailField()
    terrain_id       = serializers.IntegerField()
    creneau_id       = serializers.IntegerField()
    date_reservation = serializers.DateField()
    methode_paiement = serializers.ChoiceField(
        choices=['especes'],
        default='especes',
    )
    langue = serializers.ChoiceField(choices=['pt', 'fr'], default='pt', required=False)

    def validate_date_reservation(self, value):
        today = date.today()
        if value < today:
            raise serializers.ValidationError("La date ne peut pas être dans le passé.")
        if value > today + timedelta(days=90):
            raise serializers.ValidationError("La réservation ne peut pas dépasser 90 jours à l'avance.")
        return value

    def validate_creneau_id(self, value):
        # Vérifie que le créneau existe et est actif
        if not Creneau.objects.filter(id=value, actif=True).exists():
            raise serializers.ValidationError("Ce créneau n'existe pas ou n'est plus actif.")
        return value

    def validate_terrain_id(self, value):
        if not Terrain.objects.filter(id=value, actif=True).exists():
            raise serializers.ValidationError("Ce terrain n'existe pas ou n'est plus actif.")
        return value

    def validate(self, data):
        # Vérifie la disponibilité du créneau à cette date
        deja = Reservation.objects.filter(
            terrain_id=data['terrain_id'],
            creneau_id=data['creneau_id'],
            date_reservation=data['date_reservation'],
            statut__in=['en_attente', 'confirmee'],
        ).exists()
        if deja:
            raise serializers.ValidationError(
                {"creneau_id": "Ce créneau est déjà réservé pour cette date."}
            )
        return data


class ReservationUpdateSerializer(serializers.Serializer):
    """Admin uniquement — mise à jour partielle d'une réservation."""
    statut           = serializers.ChoiceField(
        choices=['en_attente', 'confirmee', 'annulee', 'terminee'],
        required=False,
    )
    note             = serializers.CharField(required=False, allow_blank=True)
    date_reservation = serializers.DateField(required=False)
    terrain_id       = serializers.IntegerField(required=False)
    creneau_id       = serializers.IntegerField(required=False)
    montant          = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)

    def validate_creneau_id(self, value):
        if not Creneau.objects.filter(id=value, actif=True).exists():
            raise serializers.ValidationError("Ce créneau n'existe pas ou n'est plus actif.")
        return value

    def validate_terrain_id(self, value):
        if not Terrain.objects.filter(id=value, actif=True).exists():
            raise serializers.ValidationError("Ce terrain n'existe pas ou n'est plus actif.")
        return value


class PaiementSurPlaceSerializer(serializers.Serializer):
    """Admin — marque un paiement espèces comme payé."""
    methode   = serializers.ChoiceField(choices=['especes'], default='especes')
    reference = serializers.CharField(required=False, allow_blank=True)


class ContactMessageSerializer(serializers.Serializer):

    nom       = serializers.CharField(max_length=100, required=False, allow_blank=True)
    prenom    = serializers.CharField(max_length=100, required=False, allow_blank=True)
    email     = serializers.EmailField()
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    reference_reservation = serializers.CharField(max_length=32, required=False, allow_blank=True)
    motif     = serializers.ChoiceField(
        choices=['annuler_reservation', 'modifier_reservation', 'autres_infos'],
        default='autres_infos',
    )
    message   = serializers.CharField(max_length=3000)
    langue    = serializers.ChoiceField(choices=['pt', 'fr'], default='pt', required=False)

    def validate(self, data):
        motif = data.get('motif')
        email = (data.get('email') or '').strip()
        reference = (data.get('reference_reservation') or '').strip()

        if motif in ['annuler_reservation', 'modifier_reservation']:
            if not reference:
                raise serializers.ValidationError({'reference_reservation': 'La référence de réservation est obligatoire.'})
            reservation = Reservation.objects.filter(
                code_reference__iexact=reference,
                client__email__iexact=email,
            ).first()
            if not reservation:
                raise serializers.ValidationError({
                    'reference_reservation': "Aucune réservation ne correspond à cette référence et à cet email."
                })
            data['reference_reservation'] = reservation.code_reference

            data['nom'] = data.get('nom') or ''
            data['prenom'] = data.get('prenom') or ''
            data['telephone'] = data.get('telephone') or ''
            return data

        if not (data.get('nom') or '').strip() or not (data.get('prenom') or '').strip():
            raise serializers.ValidationError({'nom': 'Le nom et le prénom sont obligatoires.'})
        return data


class ContactMessageAdminSerializer(serializers.ModelSerializer):
    motif_display = serializers.CharField(source='get_motif_display', read_only=True)

    class Meta:
        model = ContactMessage
        fields = ['id', 'nom', 'prenom', 'email', 'telephone', 'reference_reservation', 'motif',
                  'motif_display', 'message', 'langue', 'traite', 'created_at']