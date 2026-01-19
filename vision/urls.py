from django.urls import path
from . import views

urlpatterns = [
    path("test-colab/", views.test_colab_connection, name="test_colab"),
    path("verify/", views.verify_and_record, name="verify"),
    path("blockchain/record/", views.record_to_blockchain, name="blockchain_record"),
    path("blockchain/verification/<int:verification_id>/", views.get_blockchain_verification, name="blockchain_get"),
    path("blockchain/verifications/", views.list_blockchain_verifications, name="blockchain_list"),
]
