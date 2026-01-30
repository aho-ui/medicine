from .models import AuditLog


def log_action(action, task, user=None, target_id="", details=None):
    AuditLog.objects.create(
        action=action,
        user=user,
        username=user.username if user else "",
        task=task,
        target_id=str(target_id) if target_id else "",
        details=details
    )
