# reservations/utils/emails.py
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .pdf import generer_recu_pdf


def _date_match_fr(date_obj) -> str:
    from django.utils.formats import date_format
    from django.utils.translation import override

    with override('fr'):
        return date_format(date_obj, 'l d F Y').capitalize()


def _lang_from_data(data, default='pt') -> str:
    lang = getattr(data, 'langue', None) if not isinstance(data, dict) else data.get('langue')
    return lang if lang in ['pt', 'fr'] else default


def _date_match(date_obj, lang='pt') -> str:
    from django.utils.formats import date_format
    from django.utils.translation import override

    with override('pt' if lang == 'pt' else 'fr'):
        return date_format(date_obj, 'l d F Y').capitalize()


def _label(lang, kind, value):
    labels = {
        'fr': {
            'statut': {'en_attente': 'En attente', 'confirmee': 'Confirmée', 'annulee': 'Annulée', 'terminee': 'Terminée'},
            'methode': {'en_ligne': 'En ligne', 'especes': 'Espèces', 'virement': 'Virement', 'ccp': 'CCP'},
            'paiement': {'en_attente': 'En attente', 'paye': 'Payé', 'rembourse': 'Remboursé', 'echoue': 'Échoué'},
            'motif': {'annuler_reservation': 'Annuler réservation', 'modifier_reservation': 'Modifier réservation', 'autres_infos': 'Autres infos'},
        },
        'pt': {
            'statut': {'en_attente': 'Pendente', 'confirmee': 'Confirmada', 'annulee': 'Cancelada', 'terminee': 'Concluída'},
            'methode': {'en_ligne': 'Online', 'especes': 'Dinheiro', 'virement': 'Transferência', 'ccp': 'CCP'},
            'paiement': {'en_attente': 'Pendente', 'paye': 'Pago', 'rembourse': 'Reembolsado', 'echoue': 'Falhou'},
            'motif': {'annuler_reservation': 'Cancelar reserva', 'modifier_reservation': 'Modificar reserva', 'autres_infos': 'Outras informações'},
        },
    }
    return labels.get(lang, labels['pt']).get(kind, {}).get(value, value or '—')


EMAIL_TEXTS = {
    'fr': {
        'created_subject': '[Réservation créée] BissauJogo',
        'created_success': 'Réservation créée avec succès',
        'hello': 'Bonjour',
        'created_intro': 'Votre réservation a bien été enregistrée.',
        'created_intro_html': 'Votre réservation a bien été enregistrée. Vous trouverez votre reçu PDF en pièce jointe.',
        'terrain': 'Terrain',
        'address': 'Adresse',
        'date': 'Date',
        'slot': 'Créneau',
        'amount': 'Montant',
        'payment': 'Paiement',
        'reference': 'Référence',
        'receipt_attached': 'Veuillez trouver votre reçu en pièce jointe.',
        'see_you': 'À bientôt sur le terrain !',
        'team': "L'équipe BissauJogo",
        'cash_txt': "Présentez-vous 10 minutes avant votre créneau. Le règlement s'effectue à l'accueil.",
        'cash_html': "Présentez-vous <strong>10 minutes avant</strong> votre créneau. Le règlement s'effectue à l'accueil.",
        'online_txt': 'Effectuez le paiement via Orange Money avec la référence indiquée. Dès validation, la réservation sera confirmée automatiquement.',
        'online_html': 'Effectuez le paiement via <strong>Orange Money</strong> avec la référence indiquée. Dès validation, la réservation sera confirmée automatiquement.',
        'next_step': 'Prochaine étape',
        'important': 'Important',
        'important_text': "Présentez ce message ou votre reçu PDF à l'accueil le jour du match.",
        'footer_reservation': 'BissauJogo · Réservation terrain',
        'contact_received_subject': '[Message reçu] BissauJogo',
        'contact_received_header': 'Message reçu par BissauJogo',
        'contact_received': 'Nous avons bien reçu votre message.',
        'contact_summary': 'Nous avons bien reçu votre message. Voici un récapitulatif.',
        'reason': 'Motif',
        'phone': 'Téléphone',
        'reservation_ref': 'Référence réservation',
        'your_message': 'Votre message',
        'reply_soon': 'Nous vous répondrons dans les meilleurs délais.',
        'status': 'Statut',
        'payment_status': 'Statut paiement',
        'local_payment_due': 'À régler sur place',
        'details': 'Détails',
        'confirmed_title': 'Réservation confirmée',
        'confirmed_subject': '[Statut confirmé] BissauJogo',
        'confirmed_intro': 'Votre réservation est maintenant confirmée.',
        'confirmed_note': 'Présentez-vous 10 minutes avant le début du créneau avec votre référence de réservation.',
        'cancelled_title': 'Réservation annulée',
        'cancelled_subject': '[Statut annulé] BissauJogo',
        'cancelled_intro': 'Votre réservation a été annulée.',
        'cancelled_note': "Si vous pensez qu'il s'agit d'une erreur, contactez rapidement l'équipe BissauJogo en indiquant votre référence.",
        'finished_title': 'Réservation terminée',
        'finished_subject': '[Statut terminé] BissauJogo',
        'finished_intro': 'Votre réservation est marquée comme terminée.',
        'finished_note': "Merci d'avoir choisi BissauJogo. Nous espérons vous revoir très bientôt.",
        'modified_title': 'Réservation modifiée',
        'modified_subject': '[Réservation modifiée] BissauJogo',
        'modified_intro': 'Les informations de votre réservation ont été mises à jour.',
        'modified_note': 'Merci de vérifier attentivement les nouveaux détails ci-dessous.',
        'moved_title': 'Réservation déplacée',
        'moved_subject': '[Réservation déplacée] BissauJogo',
        'moved_intro': "Votre réservation a été déplacée par l'administration.",
        'moved_note': "Merci de bien prendre en compte la nouvelle date, le terrain, l'adresse et le créneau indiqués ci-dessous.",
        'payment_received_title': 'Paiement reçu',
        'payment_received_subject': '[Paiement reçu] BissauJogo',
        'payment_received_intro': 'Votre paiement a bien été enregistré.',
        'payment_received_note': 'Votre reçu est joint à ce message.',
    },
    'pt': {
        'created_subject': '[Reserva criada] BissauJogo',
        'created_success': 'Reserva criada com sucesso',
        'hello': 'Olá',
        'created_intro': 'A sua reserva foi registada com sucesso.',
        'created_intro_html': 'A sua reserva foi registada com sucesso. Encontrará o seu recibo PDF em anexo.',
        'terrain': 'Campo',
        'address': 'Endereço',
        'date': 'Data',
        'slot': 'Horário',
        'amount': 'Montante',
        'payment': 'Pagamento',
        'reference': 'Referência',
        'receipt_attached': 'Encontra o seu recibo em anexo.',
        'see_you': 'Até breve no campo!',
        'team': 'A equipa BissauJogo',
        'cash_txt': 'Apresente-se 10 minutos antes do seu horário. O pagamento é feito na receção.',
        'cash_html': 'Apresente-se <strong>10 minutos antes</strong> do seu horário. O pagamento é feito na receção.',
        'online_txt': 'Efetue o pagamento via Orange Money com a referência indicada. Após a validação, a reserva será confirmada automaticamente.',
        'online_html': 'Efetue o pagamento via <strong>Orange Money</strong> com a referência indicada. Após a validação, a reserva será confirmada automaticamente.',
        'next_step': 'Próxima etapa',
        'important': 'Importante',
        'important_text': 'Apresente esta mensagem ou o seu recibo PDF na receção no dia do jogo.',
        'footer_reservation': 'BissauJogo · Reserva de campo',
        'contact_received_subject': '[Mensagem recebida] BissauJogo',
        'contact_received_header': 'Mensagem recebida pela BissauJogo',
        'contact_received': 'Recebemos a sua mensagem.',
        'contact_summary': 'Recebemos a sua mensagem. Segue um resumo.',
        'reason': 'Motivo',
        'phone': 'Telefone',
        'reservation_ref': 'Referência da reserva',
        'your_message': 'A sua mensagem',
        'reply_soon': 'Responderemos o mais rapidamente possível.',
        'status': 'Estado',
        'payment_status': 'Estado do pagamento',
        'local_payment_due': 'A pagar no local',
        'details': 'Detalhes',
        'confirmed_title': 'Reserva confirmada',
        'confirmed_subject': '[Estado confirmado] BissauJogo',
        'confirmed_intro': 'A sua reserva está agora confirmada.',
        'confirmed_note': 'Apresente-se 10 minutos antes do início do horário com a sua referência de reserva.',
        'cancelled_title': 'Reserva cancelada',
        'cancelled_subject': '[Estado cancelado] BissauJogo',
        'cancelled_intro': 'A sua reserva foi cancelada.',
        'cancelled_note': 'Se pensa que se trata de um erro, contacte rapidamente a equipa BissauJogo indicando a sua referência.',
        'finished_title': 'Reserva concluída',
        'finished_subject': '[Estado concluído] BissauJogo',
        'finished_intro': 'A sua reserva foi marcada como concluída.',
        'finished_note': 'Obrigado por escolher a BissauJogo. Esperamos vê-lo novamente em breve.',
        'modified_title': 'Reserva modificada',
        'modified_subject': '[Reserva modificada] BissauJogo',
        'modified_intro': 'As informações da sua reserva foram atualizadas.',
        'modified_note': 'Por favor, verifique atentamente os novos detalhes abaixo.',
        'moved_title': 'Reserva alterada',
        'moved_subject': '[Reserva alterada] BissauJogo',
        'moved_intro': 'A sua reserva foi alterada pela administração.',
        'moved_note': 'Por favor, tenha em atenção a nova data, o campo, o endereço e o horário indicados abaixo.',
        'payment_received_title': 'Pagamento recebido',
        'payment_received_subject': '[Pagamento recebido] BissauJogo',
        'payment_received_intro': 'O seu pagamento foi registado com sucesso.',
        'payment_received_note': 'O seu recibo está anexado a esta mensagem.',
    },
}


def _valeur(valeur, defaut='-') -> str:
    texte = str(valeur).strip() if valeur is not None else ''
    return texte if texte else defaut


def _ligne_info_html(label, valeur, *, dernier=False, important=False) -> str:
    fond = "background:#eef6ff;" if important else ""
    bordure = "" if dernier else "border-bottom:1px solid #eef2f7;"
    label_style = "color:#0f172a;font-size:13px;font-weight:900;min-width:160px;" if important else "color:#64748b;font-size:13px;min-width:160px;"
    valeur_style = "font-weight:900;font-size:14px;color:#1a56a0;text-align:right;word-break:break-word;padding-left:18px;" if important else "font-weight:900;font-size:13px;text-align:right;word-break:break-word;padding-left:18px;"
    return f"""
          <div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:12px 14px;{bordure}{fond}">
            <div style="{label_style}">{label}</div>
            <div style="{valeur_style}">{_valeur(valeur)}</div>
          </div>
""".rstrip()


def _ligne_simple_html(label, valeur) -> str:
    return f"""<div style="margin-bottom:5px;"><strong style="color:#0f172a;">{label} :</strong>&nbsp;<span>{_valeur(valeur)}</span></div>"""


def _charger_reservation(reservation):
    """
    S'assure que les relations nécessaires sont chargées pour éviter
    les requêtes N+1 dans les templates d'email et la génération PDF.
    """
    from ..models import Reservation
    return (
        Reservation.objects
        .select_related('client', 'terrain', 'creneau', 'paiement')
        .get(pk=reservation.pk)
    )


def envoyer_confirmation_client(reservation):
    reservation = _charger_reservation(reservation)
    email_client = (reservation.client.email or '').strip()
    if not email_client:
        raise ValueError(f"Email client manquant pour la réservation #{reservation.id}")
    print(f"[EMAIL CLIENT] Préparation envoi réservation #{reservation.id} vers {email_client}")
    pdf_bytes   = generer_recu_pdf(reservation)
    lang = _lang_from_data(reservation)
    tr = EMAIL_TEXTS[lang]

    ref = getattr(reservation, 'code_reference', '') or f"#{reservation.id}"
    sujet = f"{tr['created_subject']} — {ref}"

    methode_label = _label(lang, 'methode', reservation.paiement.methode)
    statut_label  = _label(lang, 'paiement', reservation.paiement.statut)
    adresse = getattr(reservation.terrain, 'adresse', '') or ''
    adresse_html = f"<div style='color:#64748b;font-size:13px;margin-top:2px'>{adresse}</div>" if adresse else ""

    paiement_instructions_txt = (
        tr['cash_txt']
        if reservation.paiement.methode == 'especes'
        else tr['online_txt']
    )
    paiement_instructions_html = (
        tr['cash_html']
        if reservation.paiement.methode == 'especes'
        else tr['online_html']
    )

    corps_txt = f"""
{tr['hello']} {reservation.client.prenom} {reservation.client.nom},

{tr['created_intro']}

  {tr['terrain']}     : {reservation.terrain.nom}
  {tr['address']}     : {adresse if adresse else '-'}
  {tr['date']}        : {_date_match(reservation.date_reservation, lang)}
  {tr['slot']}     : {reservation.creneau.heure_debut.strftime('%H:%M')} – {reservation.creneau.heure_fin.strftime('%H:%M')}
  {tr['amount']}     : {reservation.montant} XOF
  {tr['payment']}    : {methode_label} ({statut_label})
  {tr['reference']}   : {ref}

{paiement_instructions_txt}

{tr['receipt_attached']}

{tr['see_you']}
{tr['team']}
""".strip()

    corps_html = f"""
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f0f4f9;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
    <div style="max-width:680px;margin:0 auto;padding:22px;">
      <div style="background:#0e3d70;border-radius:14px;padding:18px 18px 16px;">
        <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.02em;">BissauJogo</div>
        <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,.72);">{tr['created_success']}</div>

      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-top:12px;">
        <div style="font-size:16px;font-weight:800;margin-bottom:6px;">{tr['hello']} {reservation.client.prenom} {reservation.client.nom},</div>
        <div style="font-size:14px;line-height:1.6;color:#475569;">
          {tr['created_intro_html']}

        </div>

        <div style="height:1px;background:#eef2f7;margin:14px 0;"></div>

        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:260px;">
            <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;font-weight:700;">{tr['terrain']}</div>

            <div style="font-size:15px;font-weight:900;color:#0e3d70;">{reservation.terrain.nom}</div>
            {adresse_html}
          </div>
          <div style="flex:1;min-width:260px;">
            <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;font-weight:700;">{tr['reference']}</div>

            <div style="font-size:15px;font-weight:800;">{ref}</div>
          </div>
        </div>

        <div style="margin-top:14px;font-size:13px;color:#475569;line-height:1.6;">
          <strong>{tr['next_step']} :</strong> {paiement_instructions_html}
          <br/>
          <strong>{tr['important']} :</strong> {tr['important_text']}

        </div>
      </div>

      <div style="text-align:center;color:#64748b;font-size:12px;margin-top:14px;">
        {tr['footer_reservation']}

      </div>
    </div>
  </body>
</html>
""".strip()

    msg = EmailMultiAlternatives(
        subject=sujet,
        body=corps_txt,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[email_client],
    )
    msg.attach_alternative(corps_html, "text/html")
    msg.attach(
        filename=f"recu_bissaujogo_{reservation.id}.pdf",
        content=pdf_bytes,
        mimetype="application/pdf",
    )
    sent_count = msg.send(fail_silently=False)
    print(f"[EMAIL CLIENT] Résultat envoi réservation #{reservation.id} vers {email_client}: {sent_count}")


def envoyer_notification_admin(reservation):
    reservation = _charger_reservation(reservation)
    pdf_bytes = generer_recu_pdf(reservation)
    c = reservation.client
    cr = reservation.creneau
    adresse = getattr(reservation.terrain, 'adresse', '') or ''
    ref = getattr(reservation, 'code_reference', '') or f"#{reservation.id}"
    sujet = f"[Admin] Nouvelle réservation — {ref} — {_date_match_fr(reservation.date_reservation)}"

    corps_txt = f"""
Nouvelle réservation reçue sur BissauJogo.

RÉSERVATION
  Référence      : {ref}
  Date du match  : {_date_match_fr(reservation.date_reservation)}
  Créneau        : {cr.heure_debut.strftime('%H:%M')} – {cr.heure_fin.strftime('%H:%M')}
  Terrain        : {reservation.terrain.nom}
  Adresse        : {adresse if adresse else '-'}
  Statut         : {reservation.get_statut_display()}

CLIENT
  Nom            : {c.prenom} {c.nom}
  Téléphone      : {c.telephone}
  Email          : {c.email}

PAIEMENT
  Montant        : {reservation.montant} XOF
  Méthode        : {reservation.paiement.get_methode_display()}
  Statut paiement: {reservation.paiement.get_statut_display()}

Le reçu PDF est joint à ce message.
""".strip()

    corps_html = f"""
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f0f4f9;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
    <div style="max-width:760px;margin:0 auto;padding:22px;">
      <div style="background:#0e3d70;border-radius:14px;padding:18px 20px;">
        <div style="font-size:18px;font-weight:900;color:#ffffff;">Nouvelle réservation à traiter</div>
        <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,.78);">Référence {ref} · {_date_match_fr(reservation.date_reservation)} · {cr.heure_debut.strftime('%H:%M')} – {cr.heure_fin.strftime('%H:%M')}</div>
        <div style="margin-top:6px;font-size:12px;color:rgba(255,255,255,.70);">Ce message est destiné à l'administrateur. Le reçu PDF est joint.</div>
      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-top:12px;">
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <div style="flex:1;min-width:300px;border:1px solid #e2e8f0;border-radius:12px;padding:14px 14px 12px;background:#f8fafc;">
            <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;font-weight:800;">Réservation</div>
            <div style="margin-top:8px;font-size:13px;color:#475569;line-height:1.7;">
              {_ligne_simple_html('Terrain', reservation.terrain.nom)}
              {_ligne_simple_html('Adresse', adresse) if adresse else ""}
              {_ligne_simple_html('Date du match', _date_match_fr(reservation.date_reservation))}
              {_ligne_simple_html('Créneau', f"{cr.heure_debut.strftime('%H:%M')} – {cr.heure_fin.strftime('%H:%M')}")}
              {_ligne_simple_html('Statut', reservation.get_statut_display())}
            </div>
          </div>

          <div style="flex:1;min-width:300px;border:1px solid #e2e8f0;border-radius:12px;padding:14px 14px 12px;background:#ffffff;">
            <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;font-weight:800;">Client</div>
            <div style="margin-top:8px;font-size:13px;color:#475569;line-height:1.7;">
              {_ligne_simple_html('Nom', f"{c.prenom} {c.nom}")}
              {_ligne_simple_html('Téléphone', c.telephone)}
              {_ligne_simple_html('Email', c.email)}
            </div>
          </div>
        </div>

        <div style="margin-top:14px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          {_ligne_info_html('Paiement', f"{reservation.paiement.get_methode_display()} · {reservation.paiement.get_statut_display()}")}
          {_ligne_info_html('Montant', f"{reservation.montant} XOF", dernier=True, important=True)}
        </div>

        <div style="margin-top:12px;font-size:13px;color:#475569;line-height:1.6;">
          <strong>À faire :</strong> Vérifiez le statut du paiement si nécessaire. Le reçu PDF est joint pour archivage.
        </div>
      </div>
    </div>
  </body>
</html>
""".strip()

    msg = EmailMultiAlternatives(
        subject=sujet,
        body=corps_txt,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.ADMIN_EMAIL],
    )
    msg.attach_alternative(corps_html, "text/html")
    msg.attach(
        filename=f"recu_bissaujogo_{reservation.id}.pdf",
        content=pdf_bytes,
        mimetype="application/pdf",
    )
    msg.send(fail_silently=False)


def envoyer_notification_statut_client(reservation, type_notification, details=''):
    reservation = _charger_reservation(reservation)
    c = reservation.client
    cr = reservation.creneau
    lang = _lang_from_data(reservation)
    tr = EMAIL_TEXTS[lang]
    ref = getattr(reservation, 'code_reference', '') or f"#{reservation.id}"
    adresse = getattr(reservation.terrain, 'adresse', '') or ''
    adresse_label = adresse if adresse else '-'

    config = {
        'confirmee': {'titre': tr['confirmed_title'], 'sujet': f"{tr['confirmed_subject']} — {ref}", 'intro': tr['confirmed_intro'], 'couleur': '#0e3d70', 'note': tr['confirmed_note'], 'attach_pdf': True},
        'annulee': {'titre': tr['cancelled_title'], 'sujet': f"{tr['cancelled_subject']} — {ref}", 'intro': tr['cancelled_intro'], 'couleur': '#b91c1c', 'note': tr['cancelled_note'], 'attach_pdf': False},
        'terminee': {'titre': tr['finished_title'], 'sujet': f"{tr['finished_subject']} — {ref}", 'intro': tr['finished_intro'], 'couleur': '#334155', 'note': tr['finished_note'], 'attach_pdf': False},
        'modifiee': {'titre': tr['modified_title'], 'sujet': f"{tr['modified_subject']} — {ref}", 'intro': tr['modified_intro'], 'couleur': '#1a56a0', 'note': tr['modified_note'], 'attach_pdf': True},
        'deplacee': {'titre': tr['moved_title'], 'sujet': f"{tr['moved_subject']} — {ref}", 'intro': tr['moved_intro'], 'couleur': '#4f46e5', 'note': tr['moved_note'], 'attach_pdf': True},
        'paiement': {'titre': tr['payment_received_title'], 'sujet': f"{tr['payment_received_subject']} — {ref}", 'intro': tr['payment_received_intro'], 'couleur': '#047857', 'note': tr['payment_received_note'], 'attach_pdf': True},
    }.get(type_notification)

    if not config:
        return

    paiement_label = (
        tr['local_payment_due']
        if type_notification == 'confirmee' and reservation.paiement.methode == 'especes' and reservation.paiement.statut != 'paye'
        else f"{_label(lang, 'methode', reservation.paiement.methode)} · {_label(lang, 'paiement', reservation.paiement.statut)}"
    )
    detail_txt = f"\n{tr['details']} : {details}\n" if details else ""
    corps_txt = f"""
{tr['hello']} {c.prenom} {c.nom},

{config['intro']}
{detail_txt}
{tr['reservation_ref'].upper()}
  {tr['reference']}      : {ref}
  {tr['status']}         : {_label(lang, 'statut', reservation.statut)}
  {tr['terrain']}        : {reservation.terrain.nom}
  {tr['address']}        : {adresse_label}
  {tr['date']}           : {_date_match(reservation.date_reservation, lang)}
  {tr['slot']}           : {cr.heure_debut.strftime('%H:%M')} – {cr.heure_fin.strftime('%H:%M')}
  {tr['amount']}         : {reservation.montant} XOF

{tr['payment'].upper()}
  {tr['payment_status']} : {paiement_label}

{config['note']}

{tr['team']}
""".strip()

    details_html = f"""
        <div style="margin-top:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;color:#9a3412;font-size:13px;line-height:1.6;">
          <strong>{tr['details']} :</strong> {details}
        </div>
""" if details else ""
    couleur_header = "linear-gradient(135deg,#4f46e5 0%,#7c3aed 58%,#a855f7 100%)" if type_notification == 'deplacee' else config['couleur']
    fond_carte = "#f5f3ff" if type_notification == 'deplacee' else "#ffffff"
    bordure_carte = "#ddd6fe" if type_notification == 'deplacee' else "#e2e8f0"

    corps_html = f"""
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f0f4f9;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
    <div style="max-width:720px;margin:0 auto;padding:22px;">
      <div style="background:{couleur_header};border-radius:14px;padding:18px 20px;">
        <div style="font-size:20px;font-weight:900;color:#ffffff;">{config['titre']}</div>
        <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,.78);">{tr['reference']} {ref}</div>
      </div>

      <div style="background:{fond_carte};border:1px solid {bordure_carte};border-radius:14px;padding:18px;margin-top:12px;">
        <div style="font-size:16px;font-weight:800;margin-bottom:6px;">{tr['hello']} {c.prenom} {c.nom},</div>
        <div style="font-size:14px;line-height:1.6;color:#475569;">{config['intro']}</div>
        {details_html}

        <div style="height:1px;background:#eef2f7;margin:14px 0;"></div>

        <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#ffffff;">
          {_ligne_info_html(tr['status'], _label(lang, 'statut', reservation.statut))}
          {_ligne_info_html(tr['terrain'], reservation.terrain.nom)}
          {_ligne_info_html(tr['address'], adresse_label)}
          {_ligne_info_html(tr['date'], _date_match(reservation.date_reservation, lang))}
          {_ligne_info_html(tr['slot'], f"{cr.heure_debut.strftime('%H:%M')} – {cr.heure_fin.strftime('%H:%M')}")}
          {_ligne_info_html(tr['payment'], paiement_label)}
          {_ligne_info_html(tr['amount'], f"{reservation.montant} XOF", dernier=True, important=True)}
        </div>

        <div style="margin-top:14px;font-size:13px;color:#475569;line-height:1.6;">{config['note']}</div>
      </div>
    </div>
  </body>
</html>
""".strip()

    msg = EmailMultiAlternatives(
        subject=config['sujet'],
        body=corps_txt,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[c.email],
    )
    msg.attach_alternative(corps_html, "text/html")
    if config['attach_pdf']:
        msg.attach(
            filename=f"recu_bissaujogo_{ref}.pdf",
            content=generer_recu_pdf(reservation),
            mimetype="application/pdf",
        )
    msg.send(fail_silently=False)


def envoyer_contact_message(contact_data):
    lang = _lang_from_data(contact_data)
    tr = EMAIL_TEXTS[lang]
    motif_map = {
        'annuler_reservation': 'Annuler réservation',
        'modifier_reservation': 'Modifier réservation',
        'autres_infos': 'Autres infos',
    }

    motif_label = motif_map.get(contact_data.get('motif'), contact_data.get('motif') or '—')
    motif_label_client = _label(lang, 'motif', contact_data.get('motif'))

    nom = (contact_data.get('nom') or '').strip()
    prenom = (contact_data.get('prenom') or '').strip()
    email = (contact_data.get('email') or '').strip()
    telephone = (contact_data.get('telephone') or '').strip()
    reference_reservation = (contact_data.get('reference_reservation') or '').strip()
    message = (contact_data.get('message') or '').strip()

    client_label = f"{prenom} {nom}".strip() or email
    sujet_admin = f"[Contact client] {motif_label} — {client_label}".strip()
    sujet_client = f"{tr['contact_received_subject']} — {motif_label_client}".strip()

    corps_txt_admin = f"""
Nouveau message via la page Contact.

  Motif     : {motif_label}
  Nom       : {client_label}
  Email     : {email}
  Téléphone : {telephone if telephone else '-'}
  Référence : {reference_reservation if reference_reservation else '-'}

Message :
{message}

L'équipe BissauJogo
""".strip()

    corps_html_admin = f"""
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f0f4f9;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
    <div style="max-width:760px;margin:0 auto;padding:22px;">
      <div style="background:#0e3d70;border-radius:14px;padding:16px 18px;">
        <div style="font-size:18px;font-weight:900;color:#ffffff;">Nouveau message client</div>
        <div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,.72);">Motif : {motif_label}</div>
      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-top:12px;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:280px;">
            <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;font-weight:700;">Client</div>
            <div style="font-size:14px;font-weight:900;">{client_label}</div>
            <div style="font-size:13px;color:#475569;margin-top:4px;">{email}{f" · {telephone}" if telephone else ""}</div>
            {f"<div style='font-size:13px;color:#475569;margin-top:4px'>Référence : {reference_reservation}</div>" if reference_reservation else ""}
          </div>
        </div>

        <div style="height:1px;background:#eef2f7;margin:14px 0;"></div>

        <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:8px;">Message</div>
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.7;color:#0f172a;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">{message}</div>

        <div style="margin-top:12px;font-size:13px;color:#475569;line-height:1.6;">
          <strong>Astuce :</strong> Répondre à ce mail répondra directement au client (Reply-To).
        </div>
      </div>
    </div>
  </body>
</html>
""".strip()

    msg_admin = EmailMultiAlternatives(
        subject=sujet_admin,
        body=corps_txt_admin,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.ADMIN_EMAIL],
        reply_to=[email] if email else [],
    )
    msg_admin.attach_alternative(corps_html_admin, "text/html")
    msg_admin.send(fail_silently=False)

    corps_txt_client = f"""
{tr['hello']} {client_label},

{tr['contact_received']}

  {tr['reason']}     : {motif_label_client}
  Email     : {email}
  {tr['phone']} : {telephone if telephone else '-'}
  {tr['reference']} : {reference_reservation if reference_reservation else '-'}

{tr['your_message']} :
{message}

{tr['reply_soon']}
""".strip()

    corps_html_client = f"""
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f0f4f9;font-family:Arial,Helvetica,sans-serif;color:#1a202c;">
    <div style="max-width:680px;margin:0 auto;padding:22px;">
      <div style="background:#0e3d70;border-radius:14px;padding:18px 18px 16px;">
        <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.02em;">BissauJogo</div>
        <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,.72);">{tr['contact_received_header']}</div>

      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-top:12px;">
        <div style="font-size:16px;font-weight:800;margin-bottom:6px;">{tr['hello']} {client_label},</div>


        <div style="font-size:14px;line-height:1.6;color:#475569;">
          {tr['contact_summary']}

        </div>

        <div style="height:1px;background:#eef2f7;margin:14px 0;"></div>

        <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          {_ligne_info_html(tr['reason'], motif_label_client)}
          {_ligne_info_html('Email', email)}
          {f'''
          {_ligne_info_html(tr['reservation_ref'], reference_reservation)}
          ''' if reference_reservation else ""}
          {_ligne_info_html(tr['phone'], telephone, dernier=True)}
        </div>

        <div style="margin-top:12px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:8px;">{tr['your_message']}</div>

        <div style="white-space:pre-wrap;font-size:14px;line-height:1.7;color:#0f172a;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">{message}</div>

        <div style="margin-top:14px;font-size:13px;color:#475569;line-height:1.6;">
          {tr['reply_soon']}
        </div>
      </div>

      <div style="text-align:center;color:#64748b;font-size:12px;margin-top:14px;">BissauJogo · Contact</div>
    </div>
  </body>
</html>
""".strip()

    msg_client = EmailMultiAlternatives(
        subject=sujet_client,
        body=corps_txt_client,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[email],
    )
    msg_client.attach_alternative(corps_html_client, "text/html")
    msg_client.send(fail_silently=False)