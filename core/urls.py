from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health),
    path("health/blockchain/", views.health_blockchain),
    path("auth/login/", views.login),
    path("auth/logout/", views.logout),
    path("auth/me/", views.me),
    path("lots/", views.lots),
    path("lots/<uuid:lot_id>/", views.lot_detail),
    path("lots/<uuid:lot_id>/qr/", views.lot_qr),
    path("distribution/", views.distribution),
    path("users/", views.users),
    path("audit/", views.audit),
    path("audit/export/", views.audit_export),
]
