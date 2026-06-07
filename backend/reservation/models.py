# models.py
import secrets

from django.db import models
from django.utils import timezone


class Terrain(models.Model):
    nom        = models.CharField(max_length=120)
    adresse    = models.CharField(max_length=255, blank=True)
    photo      = models.ImageField(upload_to='terrains/', blank=True, null=True)
    prix_reservation = models.DecimalField(max_digits=10, decimal_places=2, default=12000)
    actif      = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return self.nom


class Client(models.Model):
    nom        = models.CharField(max_length=100)
    prenom     = models.CharField(max_length=100)
    telephone  = models.CharField(max_length=20, unique=True)
    email      = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.prenom} {self.nom} — {self.telephone}"


class ContactMessage(models.Model):
    MOTIFS = [
        ('annuler_reservation', 'Annuler réservation'),
        ('modifier_reservation', 'Modifier réservation'),
        ('autres_infos', 'Autres infos'),
    ]

    nom        = models.CharField(max_length=100)
    prenom     = models.CharField(max_length=100)
    email      = models.EmailField()
    telephone  = models.CharField(max_length=30, blank=True)
    reference_reservation = models.CharField(max_length=32, blank=True)
    motif      = models.CharField(max_length=40, choices=MOTIFS, default='autres_infos')
    message    = models.TextField()
    langue     = models.CharField(max_length=2, choices=[('pt', 'Português'), ('fr', 'Français')], default='pt')
    traite     = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.prenom} {self.nom} — {self.get_motif_display()}"


class Creneau(models.Model):
    heure_debut = models.TimeField()
    heure_fin   = models.TimeField()
    actif       = models.BooleanField(default=True)

    class Meta:
        ordering = ['heure_debut']

    def __str__(self):
        return f"{self.heure_debut:%H:%M} – {self.heure_fin:%H:%M}"


class Reservation(models.Model):
    STATUT = [
        ('en_attente', 'En attente'),
        ('confirmee',  'Confirmée'),
        ('annulee',    'Annulée'),
        ('terminee',   'Terminée'),
    ]

    client           = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='reservations')
    terrain          = models.ForeignKey(Terrain, on_delete=models.PROTECT, related_name='reservations')
    creneau          = models.ForeignKey(Creneau, on_delete=models.PROTECT, related_name='reservations')
    date_reservation = models.DateField()
    statut           = models.CharField(max_length=20, choices=STATUT, default='en_attente')
    code_reference   = models.CharField(max_length=32, blank=True, unique=True, db_index=True)
    montant          = models.DecimalField(max_digits=8, decimal_places=2, default=12000)
    note             = models.TextField(blank=True)
    langue           = models.CharField(max_length=2, choices=[('pt', 'Português'), ('fr', 'Français')], default='pt')
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['terrain', 'creneau', 'date_reservation']
        ordering        = ['-date_reservation', 'creneau__heure_debut']

    def confirmer(self, details='', skip_historique=False):
        """
        Passe la réservation en 'confirmee'.
        skip_historique=True quand l'appelant (ex: marquer_paye) crée
        déjà une entrée Historique pour éviter le doublon.
        """
        if self.statut == 'confirmee':
            return  # idempotent — ne rien faire si déjà confirmée
        self.statut = 'confirmee'
        self.save(update_fields=['statut', 'updated_at'])
        if not skip_historique:
            Historique.objects.create(
                reservation=self,
                action='confirmee',
                details=details,
            )

    def annuler(self, details=''):
        if self.statut == 'annulee':
            return
        self.statut = 'annulee'
        self.save(update_fields=['statut', 'updated_at'])
        Historique.objects.create(reservation=self, action='annulee', details=details)

    def terminer(self):
        if self.statut == 'terminee':
            return
        self.statut = 'terminee'
        self.save(update_fields=['statut', 'updated_at'])
        Historique.objects.create(reservation=self, action='terminee')

    def __str__(self):
        ref = self.code_reference or f"#{self.id}"
        return f"{ref} — {self.terrain} | {self.client} | {self.date_reservation} {self.creneau}"

    def _make_code_reference(self):
        d = timezone.localdate(self.created_at) if self.created_at else timezone.localdate()
        try:
            heure_debut = self.creneau.heure_debut.strftime('%H')
        except Exception:
            heure_debut = '00'
        for _ in range(20):
            suffix = secrets.token_hex(3).upper()
            code = f"BJ-RES-{d.strftime('%Y%m%d')}-{suffix}-{heure_debut}"
            if not Reservation.objects.filter(code_reference=code).exists():
                return code
        return f"BJ-RES-{d.strftime('%Y%m%d')}-{secrets.token_hex(6).upper()}-{heure_debut}"

    def save(self, *args, **kwargs):
        creating = self.pk is None
        super().save(*args, **kwargs)

        # Génère la référence après avoir un ID (création uniquement)
        if creating and not self.code_reference:
            self.code_reference = self._make_code_reference()
            super().save(update_fields=['code_reference'])


class Paiement(models.Model):
    METHODE = [
        ('en_ligne', 'En ligne'),   # auto-confirme la résa
        ('especes',  'Espèces'),    # paiement sur place
        ('virement', 'Virement'),
        ('ccp',      'CCP'),
    ]
    STATUT = [
        ('en_attente', 'En attente'),
        ('paye',       'Payé'),
        ('rembourse',  'Remboursé'),
        ('echoue',     'Échoué'),
    ]

    reservation   = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='paiement')
    montant       = models.DecimalField(max_digits=8, decimal_places=2)
    methode       = models.CharField(max_length=20, choices=METHODE, default='especes')
    statut        = models.CharField(max_length=20, choices=STATUT, default='en_attente')
    reference     = models.CharField(max_length=100, blank=True)
    date_paiement = models.DateTimeField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    def marquer_paye(self):
        """
        Enregistre le paiement comme payé et crée une entrée Historique.
        Si la méthode est 'en_ligne', confirme aussi la réservation en un
        seul appel, en passant skip_historique=False pour que confirmer()
        crée son propre log de confirmation séparé.
        """
        self.statut        = 'paye'
        self.date_paiement = timezone.now()
        self.save(update_fields=['statut', 'date_paiement'])

        Historique.objects.create(
            reservation=self.reservation,
            action='paiement',
            details=f"{self.get_methode_display()} — {self.montant} DA",
        )

        # Auto-confirmation pour le paiement en ligne uniquement
        if self.methode == 'en_ligne':
            self.reservation.confirmer(details='Auto-confirmée après paiement en ligne')

    def marquer_non_paye(self):
        self.statut = 'en_attente'
        self.date_paiement = None
        self.save(update_fields=['statut', 'date_paiement'])

        Historique.objects.create(
            reservation=self.reservation,
            action='paiement',
            details='Paiement marqué comme non payé',
        )

    def __str__(self):
        return f"Paiement #{self.reservation.id} — {self.montant} DA ({self.get_statut_display()})"


class Historique(models.Model):
    ACTION = [
        ('creee',      'Créée'),
        ('confirmee',  'Confirmée'),
        ('annulee',    'Annulée'),
        ('terminee',   'Terminée'),
        ('modifiee',   'Modifiée'),
        ('paiement',   'Paiement reçu'),
        ('email',      'Email envoyé'),
    ]

    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='historique')
    action      = models.CharField(max_length=20, choices=ACTION)
    details     = models.TextField(blank=True)
    date_action = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_action']

    def __str__(self):
        return f"{self.get_action_display()} — Résa #{self.reservation.id}"