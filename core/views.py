from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .models import MedicineLot, DistributionEvent, User


@csrf_exempt
@require_http_methods(["GET", "POST"])
def lots(request):
    if request.method == "GET":
        data = [{
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
        } for lot in MedicineLot.objects.all()]
        return JsonResponse({"lots": data})

    elif request.method == "POST":
        body = json.loads(request.body)
        producer = User.objects.filter(role="MANUFACTURER").first()
        if not producer:
            return JsonResponse({"error": "No manufacturer found"}, status=400)

        lot = MedicineLot.objects.create(
            product_name=body["product_name"],
            product_code=body["product_code"],
            lot_number=body["lot_number"],
            producer=producer,
            manufacture_date=body["manufacture_date"],
            expiry_date=body["expiry_date"],
            total_quantity=body["total_quantity"],
            remaining_quantity=body["total_quantity"],
        )
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
        data = [{
            "id": str(e.id),
            "lot_id": str(e.lot.id),
            "lot_number": e.lot.lot_number,
            "actor": e.actor.username,
            "quantity": e.quantity,
            "location": e.location,
            "timestamp": e.timestamp.isoformat(),
        } for e in DistributionEvent.objects.all()]
        return JsonResponse({"events": data})

    elif request.method == "POST":
        body = json.loads(request.body)
        try:
            lot = MedicineLot.objects.get(id=body["lot_id"])
        except MedicineLot.DoesNotExist:
            return JsonResponse({"error": "Lot not found"}, status=404)

        quantity = int(body["quantity"])
        if quantity > lot.remaining_quantity:
            return JsonResponse({"error": "Not enough quantity"}, status=400)

        actor = User.objects.filter(role="DISTRIBUTOR").first()
        if not actor:
            return JsonResponse({"error": "No distributor found"}, status=400)

        event = DistributionEvent.objects.create(
            lot=lot,
            actor=actor,
            quantity=quantity,
            location=body["location"],
        )
        lot.remaining_quantity -= quantity
        lot.save()

        return JsonResponse({"id": str(event.id), "remaining_quantity": lot.remaining_quantity})
