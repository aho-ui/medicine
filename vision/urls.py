from django.urls import path
from . import views

urlpatterns = [
    path("test-colab/", views.test_colab_connection, name="test_colab"),
    path("verify/", views.verify_and_record, name="verify"),
    path("stats/", views.verification_stats, name="verification_stats"),
    path("lots/<uuid:lot_id>/verifications/", views.lot_verifications, name="lot_verifications"),
    path("verifications/pending/", views.pending_verifications, name="pending_verifications"),
    path("verifications/<uuid:verification_id>/approve/", views.approve_verification, name="approve_verification"),
    path("verifications/<uuid:verification_id>/link/", views.link_verification, name="link_verification"),
    path("verifications/unlinked/", views.unlinked_verifications, name="unlinked_verifications"),
    path("blockchain/record/", views.record_to_blockchain, name="blockchain_record"),
    path("blockchain/verification/<int:verification_id>/", views.get_blockchain_verification, name="blockchain_get"),
    path("blockchain/verifications/", views.list_blockchain_verifications, name="blockchain_list"),
]
