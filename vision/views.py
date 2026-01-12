from django.http import JsonResponse
from .services import call_colab_api


def test_colab_connection(request):
    result = call_colab_api()
    return JsonResponse(result)
