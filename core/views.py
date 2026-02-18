from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import login as auth_login, logout as auth_logout
from functools import wraps
import json
import qrcode
from io import BytesIO
from .models import MedicineLot, DistributionEvent, User, AuditLog
from .utils import log_action, generate_audit_pdf


def require_role(*allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({"error": "Not authenticated"}, status=401)
            if request.user.role not in allowed_roles:
                return JsonResponse({"error": "Permission denied"}, status=403)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    body = json.loads(request.body)
    user_id = body.get("user_id")
    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)
    try:
        user = User.objects.get(id=int(user_id))
        auth_login(request, user)
        log_action("LOGIN", f"User {user.username} logged in", user=user)
        return JsonResponse({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "company_name": user.company_name,
        })
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
def logout(request):
    if request.user.is_authenticated:
        log_action("LOGOUT", f"User {request.user.username} logged out", user=request.user)
    auth_logout(request)
    return JsonResponse({"success": True})


@require_http_methods(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"user": None})
    return JsonResponse({
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "role": request.user.role,
            "company_name": request.user.company_name,
        }
    })


@require_http_methods(["GET"])
def health(request):
    """Health check for Django backend."""
    return JsonResponse({"status": "ok"})


@require_http_methods(["GET"])
def health_blockchain(request):
    """Health check for Ganache blockchain connection."""
    try:
        from blockchain.utils import w3
        connected = w3.is_connected()
        if connected:
            block = w3.eth.block_number
            return JsonResponse({"status": "ok", "block_number": block})
        return JsonResponse({"status": "error", "message": "Not connected"}, status=503)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=503)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def lots(request):
    if request.method == "GET":
        qs = MedicineLot.objects.all()
        if request.user.is_authenticated and request.user.role != "ADMIN":
            qs = qs.filter(producer=request.user)

        # Filter for lots without verifications if requested
        if request.GET.get("unverified") == "true":
            qs = qs.filter(vision_inspections__isnull=True)

        data = []
        for lot in qs:
            # Calculate verification status
            pending_count = lot.vision_inspections.filter(status="PENDING").count()
            approved_count = lot.vision_inspections.filter(status="APPROVED").count()
            if pending_count > 0:
                verification_status = "PENDING"
            elif approved_count > 0:
                verification_status = "APPROVED"
            else:
                verification_status = "NONE"

            data.append({
                "id": str(lot.id),
                "product_name": lot.product_name,
                "product_code": lot.product_code,
                "lot_number": lot.lot_number,
                "producer": lot.producer.username,
                "manufacture_date": lot.manufacture_date.isoformat(),
                "expiry_date": lot.expiry_date.isoformat(),
                "total_quantity": lot.total_quantity,
                "remaining_quantity": lot.remaining_quantity,
                "blockchain_txid": lot.blockchain_txid,
                "verification_status": verification_status,
                "pending_count": pending_count,
                "approved_count": approved_count,
            })
        return JsonResponse({"lots": data})

    elif request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)
        body = json.loads(request.body)

        lot = MedicineLot.objects.create(
            product_name=body["product_name"],
            product_code=body["product_code"],
            lot_number=body["lot_number"],
            producer=request.user,
            manufacture_date=body["manufacture_date"],
            expiry_date=body["expiry_date"],
            total_quantity=body["total_quantity"],
            remaining_quantity=body["total_quantity"],
        )
        log_action("CREATE", "Created medicine lot", user=request.user, target_id=lot.id)
        return JsonResponse({"id": str(lot.id), "lot_number": lot.lot_number})


@require_http_methods(["GET"])
def lot_detail(request, lot_id):
    try:
        lot = MedicineLot.objects.get(id=lot_id)
        return JsonResponse({
            "id": str(lot.id),
            "product_name": lot.product_name,
            "product_code": lot.product_code,
            "lot_number": lot.lot_number,
            "producer": lot.producer.username,
            "manufacture_date": lot.manufacture_date.isoformat(),
            "expiry_date": lot.expiry_date.isoformat(),
            "total_quantity": lot.total_quantity,
            "remaining_quantity": lot.remaining_quantity,
            "blockchain_txid": lot.blockchain_txid,
        })
    except MedicineLot.DoesNotExist:
        return JsonResponse({"error": "Lot not found"}, status=404)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def distribution(request):
    if request.method == "GET":
        qs = DistributionEvent.objects.all()
        if request.user.is_authenticated and request.user.role != "ADMIN":
            qs = qs.filter(actor=request.user)
        data = [{
            "id": str(e.id),
            "lot_id": str(e.lot.id),
            "lot_number": e.lot.lot_number,
            "actor": e.actor.username,
            "quantity": e.quantity,
            "location": e.location,
            "timestamp": e.timestamp.isoformat(),
        } for e in qs]
        return JsonResponse({"events": data})

    elif request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)
        body = json.loads(request.body)
        try:
            lot = MedicineLot.objects.get(id=body["lot_id"])
        except MedicineLot.DoesNotExist:
            return JsonResponse({"error": "Lot not found"}, status=404)

        quantity = int(body["quantity"])
        if quantity > lot.remaining_quantity:
            return JsonResponse({"error": "Not enough quantity"}, status=400)

        event = DistributionEvent.objects.create(
            lot=lot,
            actor=request.user,
            quantity=quantity,
            location=body["location"],
        )
        lot.remaining_quantity -= quantity
        lot.save()
        log_action("DISTRIBUTE", "Distributed medicine", user=request.user, target_id=event.id)
        return JsonResponse({"id": str(event.id), "remaining_quantity": lot.remaining_quantity})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def users(request):
    if request.method == "GET":
        data = [{
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "company_name": u.company_name
        } for u in User.objects.all()]
        return JsonResponse({"users": data})

    elif request.method == "POST":
        body = json.loads(request.body)
        username = body.get("username")
        email = body.get("email")
        role = body.get("role")
        company_name = body.get("company_name", "")
        password = body.get("password")

        if not all([username, email, role, password]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already exists"}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({"error": "Email already exists"}, status=400)

        valid_roles = ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "CONSUMER", "ADMIN"]
        if role not in valid_roles:
            return JsonResponse({"error": "Invalid role"}, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            company_name=company_name,
        )
        log_action("REGISTER", f"Created user {username}", target_id=user.id)
        return JsonResponse({"id": user.id, "username": user.username})


@require_http_methods(["GET"])
def audit(request):
    logs = [{
        "action": log.action,
        "user": log.username,
        "task": log.task,
        "target_id": log.target_id,
        "timestamp": log.created_at.isoformat()
    } for log in AuditLog.objects.order_by("-created_at")]
    return JsonResponse({"logs": logs})


@require_http_methods(["GET"])
def lot_qr(request, lot_id):
    try:
        lot = MedicineLot.objects.get(id=lot_id)
    except MedicineLot.DoesNotExist:
        return JsonResponse({"error": "Lot not found"}, status=404)

    qr = qrcode.make(str(lot.id))
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)

    return HttpResponse(buffer, content_type="image/png")


@require_http_methods(["GET"])
def audit_export(request):
    logs = AuditLog.objects.order_by("-created_at")
    action = request.GET.get("action", "")
    date = request.GET.get("date", "")
    if action:
        logs = logs.filter(action=action)
    if date:
        logs = logs.filter(created_at__date=date)
    buffer = generate_audit_pdf(logs)
    response = HttpResponse(buffer, content_type="application/pdf")
    response["Content-Disposition"] = "attachment; filename=audit_logs.pdf"
    return response
