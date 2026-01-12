from django.urls import path
from . import views

urlpatterns = [
    path("test-colab/", views.test_colab_connection, name="test_colab"),
]
