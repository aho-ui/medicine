from django.urls import path
from . import views

urlpatterns = [
    path("lots/", views.lots),
    path("lots/<uuid:lot_id>/", views.lot_detail),
    path("distribution/", views.distribution),
]
