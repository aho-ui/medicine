from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from .models import AuditLog


def generate_audit_pdf(logs):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm, leftMargin=20*mm, rightMargin=20*mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("title", parent=styles["Normal"], fontSize=22, textColor=colors.HexColor("#0f172a"), alignment=TA_CENTER)
    subtitle_style = ParagraphStyle("subtitle", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#64748b"), alignment=TA_CENTER)
    elements = [
        Paragraph("MedVerifyChain", title_style),
        Spacer(1, 8*mm),
        Paragraph("Audit Log Export", subtitle_style),
        Spacer(1, 4*mm),
        Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style),
        Spacer(1, 10*mm),
    ]

    def crop(value, max_len=14):
        return value[:max_len] + "..." if len(value) > max_len else value

    header = ["Action", "User", "Task", "Target ID", "Timestamp"]
    rows = [header] + [
        [
            log.action,
            log.username or "system",
            log.task,
            crop(log.target_id) if log.target_id else "-",
            log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        ]
        for log in logs
    ]

    table = Table(rows, colWidths=[28*mm, 28*mm, 65*mm, 35*mm, 44*mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#1e293b")),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer


def log_action(action, task, user=None, target_id="", details=None):
    AuditLog.objects.create(
        action=action,
        user=user,
        username=user.username if user else "",
        task=task,
        target_id=str(target_id) if target_id else "",
        details=details
    )
