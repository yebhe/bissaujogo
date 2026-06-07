# reservations/utils/pdf.py
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from django.utils.formats import date_format
from django.utils.translation import override

# ── Palette ────────────────────────────────────────────────────────────────────
BLEU        = colors.HexColor('#0e3d70')
BLEU_LIGHT  = colors.HexColor('#1a56a0')
JAUNE       = colors.HexColor('#f5c842')
GRIS_CLAIR  = colors.HexColor('#f7f9fc')
GRIS_BORDER = colors.HexColor('#dde3ee')
GRIS_TEXTE  = colors.HexColor('#718096')
NOIR        = colors.HexColor('#1a202c')


def _lang(reservation) -> str:
    return getattr(reservation, 'langue', 'pt') if getattr(reservation, 'langue', 'pt') in ['pt', 'fr'] else 'pt'


def _date_match(date_obj, lang='pt') -> str:
    django_lang = 'pt' if lang == 'pt' else 'fr'
    with override(django_lang):
        return date_format(date_obj, 'l d F Y').capitalize()


PDF_TEXTS = {
    'fr': {
        'reservation': 'Réservation',
        'issued': 'Émis le',
        'at': 'à',
        'client_info': 'Informations client',
        'full_name': 'Nom complet',
        'phone': 'Téléphone',
        'email': 'Email',
        'reservation_details': 'Détails de la réservation',
        'terrain': 'Terrain',
        'date': 'Date',
        'slot': 'Créneau',
        'status': 'Statut',
        'payment': 'Paiement',
        'payment_method': 'Mode de paiement',
        'payment_status': 'Statut du paiement',
        'payment_ref': 'Référence de paiement',
        'reservation_ref': 'Référence de réservation',
        'total': 'Total à régler',
        'useful_info': 'Informations utiles',
        'arrival': 'Arrivée',
        'arrival_text': 'Merci de vous présenter <strong>10 minutes avant</strong> le début du créneau.',
        'cash': 'Paiement',
        'cash_text': "Le règlement s'effectue à l'accueil.",
        'online': 'Paiement en ligne',
        'online_text': 'Effectuez le paiement via <strong>Orange Money</strong> avec la référence ci-dessous.',
        'online_done': 'Dès validation, la réservation sera confirmée automatiquement.',
        'support': 'Support',
        'support_text': "En cas de question, contactez l'équipe BissauJogo en précisant la référence de réservation.",
        'footer1': 'BissauJogo · Réservation terrain · Ce document tient lieu de reçu.',
        'footer2': 'merci de conserver ce document.',
        'receipt': 'reçu',
    },
    'pt': {
        'reservation': 'Reserva',
        'issued': 'Emitido em',
        'at': 'às',
        'client_info': 'Informações do cliente',
        'full_name': 'Nome completo',
        'phone': 'Telefone',
        'email': 'Email',
        'reservation_details': 'Detalhes da reserva',
        'terrain': 'Campo',
        'date': 'Data',
        'slot': 'Horário',
        'status': 'Estado',
        'payment': 'Pagamento',
        'payment_method': 'Modo de pagamento',
        'payment_status': 'Estado do pagamento',
        'payment_ref': 'Referência de pagamento',
        'reservation_ref': 'Referência da reserva',
        'total': 'Total a pagar',
        'useful_info': 'Informações úteis',
        'arrival': 'Chegada',
        'arrival_text': 'Apresente-se <strong>10 minutos antes</strong> do início do horário.',
        'cash': 'Pagamento',
        'cash_text': 'O pagamento é feito na receção.',
        'online': 'Pagamento online',
        'online_text': 'Efetue o pagamento via <strong>Orange Money</strong> com a referência abaixo.',
        'online_done': 'Após a validação, a reserva será confirmada automaticamente.',
        'support': 'Suporte',
        'support_text': 'Em caso de dúvida, contacte a equipa BissauJogo indicando a referência da reserva.',
        'footer1': 'BissauJogo · Reserva de campo · Este documento serve como recibo.',
        'footer2': 'obrigado por guardar este documento.',
        'receipt': 'recibo',
    },
}


def _choice_label(lang, kind, value):
    labels = {
        'fr': {
            'statut': {'en_attente': 'En attente', 'confirmee': 'Confirmée', 'annulee': 'Annulée', 'terminee': 'Terminée'},
            'methode': {'en_ligne': 'En ligne', 'especes': 'Espèces', 'virement': 'Virement', 'ccp': 'CCP'},
            'paiement': {'en_attente': 'En attente', 'paye': 'Payé', 'rembourse': 'Remboursé', 'echoue': 'Échoué'},
        },
        'pt': {
            'statut': {'en_attente': 'Pendente', 'confirmee': 'Confirmada', 'annulee': 'Cancelada', 'terminee': 'Concluída'},
            'methode': {'en_ligne': 'Online', 'especes': 'Dinheiro', 'virement': 'Transferência', 'ccp': 'CCP'},
            'paiement': {'en_attente': 'Pendente', 'paye': 'Pago', 'rembourse': 'Reembolsado', 'echoue': 'Falhou'},
        },
    }
    return labels.get(lang, labels['pt']).get(kind, {}).get(value, value)


def _valeur_pdf(valeur, defaut='-') -> str:
    texte = str(valeur).strip() if valeur is not None else ''
    return texte if texte else defaut


def generer_recu_pdf(reservation) -> bytes:
    lang = _lang(reservation)
    tr = PDF_TEXTS[lang]

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm,  bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()

    # ── Styles custom ──────────────────────────────────────────────────────────
    s_title = ParagraphStyle(
        'Title', parent=styles['Normal'],
        fontSize=26, fontName='Helvetica-Bold',
        textColor=colors.white, alignment=TA_LEFT,
    )
    s_sub = ParagraphStyle(
        'Sub', parent=styles['Normal'],
        fontSize=11, fontName='Helvetica',
        textColor=colors.HexColor('#c8e6c9'), alignment=TA_LEFT,
    )

    s_section = ParagraphStyle(
        'Section', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica-Bold',
        textColor=BLEU, spaceBefore=14, spaceAfter=6,
        borderPadding=(0, 0, 4, 0),
    )

    s_label = ParagraphStyle(
        'Label', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica',
        textColor=GRIS_TEXTE,
    )
    s_value = ParagraphStyle(
        'Value', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica-Bold',
        textColor=NOIR,
    )
    s_footer = ParagraphStyle(
        'Footer', parent=styles['Normal'],
        fontSize=9, fontName='Helvetica',
        textColor=GRIS_TEXTE, alignment=TA_CENTER,
    )
    s_note = ParagraphStyle(
        'Note', parent=styles['Normal'],
        fontSize=9.5, fontName='Helvetica',
        textColor=colors.HexColor('#475569'),
        leading=14,
    )
    s_total_label = ParagraphStyle(
        'TotalLabel', parent=styles['Normal'],
        fontSize=13, fontName='Helvetica-Bold',
        textColor=NOIR,
    )
    s_total_val = ParagraphStyle(
        'TotalVal', parent=styles['Normal'],
        fontSize=16, fontName='Helvetica-Bold',
        textColor=BLEU_LIGHT, alignment=TA_RIGHT,
    )

    story = []

    # ── En-tête coloré ─────────────────────────────────────────────────────────
    ref_txt = getattr(reservation, 'code_reference', '') or f"#{reservation.id}"
    header_data = [[
        Paragraph('BissauJogo', s_title),
        Paragraph(f"{tr['reservation']} {ref_txt}", ParagraphStyle(
            'Ref', parent=styles['Normal'],
            fontSize=13, fontName='Helvetica-Bold',
            textColor=JAUNE, alignment=TA_RIGHT,
        )),
    ]]
    header_table = Table(header_data, colWidths=['60%', '40%'])
    header_table.setStyle(TableStyle([
        ('BACKGROUND',   (0, 0), (-1, -1), BLEU),
        ('TOPPADDING',   (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 18),
        ('LEFTPADDING',  (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ('VALIGN',       (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [8]),
    ]))

    story.append(header_table)

    # Sous-titre date d'émission
    from django.utils import timezone as tz
    now = tz.localtime(tz.now())
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"{tr['issued']} {now.strftime('%d/%m/%Y')} {tr['at']} {now.strftime('%H:%M')}",
        ParagraphStyle('Emis', parent=styles['Normal'], fontSize=9,
                       textColor=GRIS_TEXTE, alignment=TA_RIGHT)
    ))
    story.append(Spacer(1, 16))

    # ── Informations client ────────────────────────────────────────────────────
    story.append(Paragraph(tr['client_info'], s_section))

    story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_BORDER, spaceAfter=8))

    c = reservation.client
    client_data = [
        [Paragraph(tr['full_name'],  s_label), Paragraph(_valeur_pdf(f'{c.prenom} {c.nom}'), s_value)],
        [Paragraph(tr['phone'],    s_label), Paragraph(_valeur_pdf(c.telephone), s_value)],
        [Paragraph(tr['email'],        s_label), Paragraph(_valeur_pdf(c.email), s_value)],
    ]
    client_table = Table(client_data, colWidths=['38%', '62%'])
    client_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), GRIS_CLAIR),
        ('TOPPADDING',    (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 14),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 14),
        ('LEFTPADDING',   (1, 0), (1, -1), 24),
        ('ROWBACKGROUNDS',(0, 0), (-1, -1), [GRIS_CLAIR, colors.white]),
        ('LINEBELOW',     (0, 0), (-1, -2), 0.3, GRIS_BORDER),
        ('ROUNDEDCORNERS', [6]),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 14))

    # ── Détails réservation ────────────────────────────────────────────────────
    story.append(Paragraph(tr['reservation_details'], s_section))

    story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_BORDER, spaceAfter=8))

    cr = reservation.creneau
    t = reservation.terrain
    terrain_lib = t.nom
    if getattr(t, 'adresse', ''):
        terrain_lib = f"{t.nom}<br/><font color='#718096'>{t.adresse}</font>"

    resa_data = [
        [Paragraph(tr['terrain'],  s_label), Paragraph(_valeur_pdf(terrain_lib), s_value)],
        [Paragraph(tr['date'],     s_label), Paragraph(_date_match(reservation.date_reservation, lang), s_value)],
        [Paragraph(tr['slot'],  s_label), Paragraph(f'{cr.heure_debut.strftime("%H:%M")} – {cr.heure_fin.strftime("%H:%M")} (1h)', s_value)],
        [Paragraph(tr['status'],   s_label), Paragraph(_valeur_pdf(_choice_label(lang, 'statut', reservation.statut)), s_value)],
    ]

    resa_table = Table(resa_data, colWidths=['38%', '62%'])
    resa_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), GRIS_CLAIR),
        ('TOPPADDING',    (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 14),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 14),
        ('LEFTPADDING',   (1, 0), (1, -1), 24),
        ('ROWBACKGROUNDS',(0, 0), (-1, -1), [GRIS_CLAIR, colors.white]),
        ('LINEBELOW',     (0, 0), (-1, -2), 0.3, GRIS_BORDER),
        ('ROUNDEDCORNERS', [6]),
    ]))
    story.append(resa_table)
    story.append(Spacer(1, 14))

    # ── Paiement ──────────────────────────────────────────────────────────────
    story.append(Paragraph(tr['payment'], s_section))

    story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_BORDER, spaceAfter=8))

    pay = reservation.paiement
    pay_data = [
        [Paragraph(tr['payment_method'],      s_label), Paragraph(_valeur_pdf(_choice_label(lang, 'methode', pay.methode)), s_value)],
        [Paragraph(tr['payment_status'],    s_label), Paragraph(_valeur_pdf(_choice_label(lang, 'paiement', pay.statut)), s_value)],
    ]
    if pay.reference:
        pay_data.append([Paragraph(tr['payment_ref'], s_label), Paragraph(_valeur_pdf(pay.reference), s_value)])
    pay_data.append([Paragraph(tr['reservation_ref'], s_label), Paragraph(_valeur_pdf(ref_txt), s_value)])

    pay_table = Table(pay_data, colWidths=['38%', '62%'])
    pay_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), GRIS_CLAIR),
        ('TOPPADDING',    (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 14),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 14),
        ('LEFTPADDING',   (1, 0), (1, -1), 24),
        ('ROWBACKGROUNDS',(0, 0), (-1, -1), [GRIS_CLAIR, colors.white]),
        ('LINEBELOW',     (0, 0), (-1, -2), 0.3, GRIS_BORDER),
        ('ROUNDEDCORNERS', [6]),
    ]))
    story.append(pay_table)
    story.append(Spacer(1, 18))

    # ── Total ─────────────────────────────────────────────────────────────────
    total_data = [[
        Paragraph(tr['total'], s_total_label),

        Paragraph(f'{reservation.montant:,.0f} XOF', s_total_val),
    ]]
    total_table = Table(total_data, colWidths=['60%', '40%'])
    total_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), colors.HexColor('#eef6ff')),
        ('TOPPADDING',    (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING',   (0, 0), (-1, -1), 16),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 16),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE',     (0, 0), (-1, 0),  1, BLEU_LIGHT),
        ('ROUNDEDCORNERS', [6]),
    ]))

    story.append(total_table)
    story.append(Spacer(1, 30))

    # ── Informations utiles ───────────────────────────────────────────────────
    story.append(Paragraph(tr['useful_info'], s_section))

    story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_BORDER, spaceAfter=8))

    if pay.methode == 'especes':
        instructions = (
            f"<strong>{tr['arrival']} :</strong> {tr['arrival_text']} "
            f"<br/><strong>{tr['cash']} :</strong> {tr['cash_text']}" 

        )
    else:
        ref_pay = pay.reference or '—'
        instructions = (
            f"<strong>{tr['online']} :</strong> {tr['online_text']} "
            f"<br/><strong>{tr['payment_ref']} :</strong> {ref_pay}"
            f"<br/>{tr['online_done']}" 

        )

    story.append(Paragraph(
        instructions
        + f"<br/><br/><strong>{tr['support']} :</strong> {tr['support_text']}",
        s_note,
    ))
    story.append(Spacer(1, 18))

    # ── Pied de page ──────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_BORDER, spaceAfter=10))
    story.append(Paragraph(
        tr['footer1'],

        s_footer
    ))
    story.append(Paragraph(
        f"{tr['reservation']} #{reservation.id} — {tr['footer2']}",

        s_footer
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generer_rapport_facturation_pdf(*, titre: str, sous_titre: str, lignes: list, total: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm,  bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()

    s_title = ParagraphStyle(
        'FTTitle', parent=styles['Normal'],
        fontSize=24, fontName='Helvetica-Bold',
        textColor=colors.white, alignment=TA_LEFT,
    )
    s_ref = ParagraphStyle(
        'FTRef', parent=styles['Normal'],
        fontSize=12, fontName='Helvetica-Bold',
        textColor=JAUNE, alignment=TA_RIGHT,
    )
    s_sub = ParagraphStyle(
        'FTSub', parent=styles['Normal'],
        fontSize=11, fontName='Helvetica',
        textColor=colors.white, alignment=TA_LEFT,
    )
    s_label = ParagraphStyle(
        'FTLabel', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica',
        textColor=GRIS_TEXTE,
    )
    s_value = ParagraphStyle(
        'FTValue', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica-Bold',
        textColor=NOIR,
    )
    s_footer = ParagraphStyle(
        'FTFooter', parent=styles['Normal'],
        fontSize=9, fontName='Helvetica',
        textColor=GRIS_TEXTE, alignment=TA_CENTER,
    )
    s_total_label = ParagraphStyle(
        'FTTotalLabel', parent=styles['Normal'],
        fontSize=13, fontName='Helvetica-Bold',
        textColor=NOIR,
    )
    s_total_val = ParagraphStyle(
        'FTTotalVal', parent=styles['Normal'],
        fontSize=16, fontName='Helvetica-Bold',
        textColor=BLEU_LIGHT, alignment=TA_RIGHT,
    )

    story = []

    header = Table([[
        Paragraph('BissauJogo', s_title),
        Paragraph(titre, s_ref),
    ]], colWidths=['60%', '40%'])
    header.setStyle(TableStyle([
        ('BACKGROUND',   (0, 0), (-1, -1), BLEU),
        ('TOPPADDING',   (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 18),
        ('LEFTPADDING',  (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ('VALIGN',       (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [8]),
    ]))
    story.append(header)
    story.append(Spacer(1, 8))
    story.append(Paragraph(sous_titre, ParagraphStyle('FTSub2', parent=s_sub, textColor=GRIS_TEXTE)))
    story.append(Spacer(1, 14))

    # table lignes
    rows = [[Paragraph('Période', s_label), Paragraph('Total', s_label)]]
    for label, val in lignes:
        rows.append([Paragraph(str(label), s_value), Paragraph(str(val), s_value)])
    tab = Table(rows, colWidths=['65%', '35%'])
    tab.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR',  (0, 0), (-1, 0), GRIS_TEXTE),
        ('LINEBELOW',  (0, 0), (-1, 0), 0.5, GRIS_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, GRIS_CLAIR]),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING',(0, 0), (-1, -1), 14),
        ('LEFTPADDING', (1, 0), (1, -1), 24),

        ('TOPPADDING',  (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 8),
        ('ROUNDEDCORNERS', [6]),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#e5e7eb')),
    ]))
    story.append(tab)
    story.append(Spacer(1, 16))

    total_table = Table([[Paragraph('Total', s_total_label), Paragraph(total, s_total_val)]], colWidths=['60%', '40%'])
    total_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), colors.HexColor('#eef6ff')),
        ('TOPPADDING',    (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING',   (0, 0), (-1, -1), 16),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 16),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE',     (0, 0), (-1, 0),  1, BLEU_LIGHT),
        ('ROUNDEDCORNERS', [6]),

    ]))
    story.append(total_table)
    story.append(Spacer(1, 22))

    story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_BORDER, spaceAfter=10))
    story.append(Paragraph('BissauJogo · Rapport de facturation', s_footer))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generer_reservations_confirmees_jour_pdf(reservations, jour) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.2*cm, rightMargin=1.2*cm,
        topMargin=1.4*cm, bottomMargin=1.4*cm,
    )

    styles = getSampleStyleSheet()
    s_title = ParagraphStyle('DayTitle', parent=styles['Normal'], fontSize=22, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_LEFT)
    s_ref = ParagraphStyle('DayRef', parent=styles['Normal'], fontSize=11, fontName='Helvetica-Bold', textColor=JAUNE, alignment=TA_RIGHT)
    s_sub = ParagraphStyle('DaySub', parent=styles['Normal'], fontSize=10, fontName='Helvetica', textColor=GRIS_TEXTE)
    s_head = ParagraphStyle('DayHead', parent=styles['Normal'], fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_CENTER)
    s_cell = ParagraphStyle('DayCell', parent=styles['Normal'], fontSize=8, fontName='Helvetica', textColor=NOIR)
    s_cell_bold = ParagraphStyle('DayCellBold', parent=s_cell, fontName='Helvetica-Bold')
    s_footer = ParagraphStyle('DayFooter', parent=styles['Normal'], fontSize=8, fontName='Helvetica', textColor=GRIS_TEXTE, alignment=TA_CENTER)

    story = []
    header = Table([[Paragraph('BissauJogo', s_title), Paragraph('Réservations confirmées', s_ref)]], colWidths=['58%', '42%'])
    header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BLEU),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(header)
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"Date du jour : {jour.strftime('%d/%m/%Y')} · Total : {len(reservations)} réservation(s)", s_sub))
    story.append(Spacer(1, 12))

    rows = [[
        Paragraph('Référence', s_head),
        Paragraph('Heure', s_head),
        Paragraph('Terrain', s_head),
        Paragraph('Adresse', s_head),
        Paragraph('Client', s_head),
        Paragraph('Téléphone', s_head),
        Paragraph('Paiement', s_head),
        Paragraph('Montant', s_head),
    ]]

    for reservation in reservations:
        paiement = getattr(reservation, 'paiement', None)
        creneau = reservation.creneau
        client = reservation.client
        rows.append([
            Paragraph(_valeur_pdf(reservation.code_reference or f"#{reservation.id}"), s_cell_bold),
            Paragraph(f"{creneau.heure_debut:%H:%M} - {creneau.heure_fin:%H:%M}", s_cell),
            Paragraph(_valeur_pdf(reservation.terrain.nom), s_cell),
            Paragraph(_valeur_pdf(reservation.terrain.adresse), s_cell),
            Paragraph(_valeur_pdf(f"{client.prenom} {client.nom}".strip()), s_cell),
            Paragraph(_valeur_pdf(client.telephone), s_cell),
            Paragraph(_valeur_pdf(paiement.get_statut_display() if paiement else '-'), s_cell),
            Paragraph(f"{reservation.montant} XOF", s_cell_bold),
        ])

    empty_report = len(rows) == 1
    if empty_report:
        rows.append([Paragraph('Aucune réservation confirmée pour aujourd’hui.', s_cell), '', '', '', '', '', '', ''])

    table = Table(rows, colWidths=[2.3*cm, 1.8*cm, 2.5*cm, 2.9*cm, 2.7*cm, 2.3*cm, 1.9*cm, 2.0*cm], repeatRows=1)

    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), BLEU_LIGHT),
        ('GRID', (0, 0), (-1, -1), 0.25, GRIS_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, GRIS_CLAIR]),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]
    if empty_report:
        style_cmds.append(('SPAN', (0, 1), (-1, 1)))
    table.setStyle(TableStyle(style_cmds))
    story.append(table)
    story.append(Spacer(1, 18))
    story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_BORDER, spaceAfter=8))
    story.append(Paragraph('BissauJogo · Liste opérationnelle des réservations confirmées du jour', s_footer))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()