from django.urls import path
from . import views

urlpatterns = [
    path("lots/", views.lots),
    path("lots/<uuid:lot_id>/", views.lot_detail),
    path("lots/<uuid:lot_id>/qr/", views.lot_qr),
    path("distribution/", views.distribution),
    path("users/", views.users),
    path("audit/", views.audit),
    path("audit/export/", views.audit_export),
]
