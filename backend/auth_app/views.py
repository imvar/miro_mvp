from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.hashers import make_password, check_password
import json

from .models import User


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    """
    POST /auth/register
    {
        "username": "user1",
        "password": "123456"
    }
    """
    try:
        data = json.loads(request.body)

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse({"error": "login and password required"}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "User already exists"}, status=409)

        user = User(
            username=username,
            password=make_password(password)  # algorithm$salt$hash
        )
        user.save()

        # Возвращаем токен и данные пользователя для автоматического входа
        response_data = {
            "token": "fake_jwt_token_here",
            "user": {
                "id": user.id,
                "username": user.username
            }
        }

        return JsonResponse(response_data, status=201)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """
    POST /auth/login
    {
        "username": "user1",
        "password": "123456"
    }
    """
    try:
        data = json.loads(request.body)

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse({"error": "login and password required"}, status=400)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": "Invalid login or password"}, status=401)

        if not check_password(password, user.password):
            return JsonResponse({"error": "Invalid login or password"}, status=401)

        # TODO: Здесь позже можно вставить JWT
        response_data = {
            "token": "fake_jwt_token_here",
            "user": {
                "id": user.id,
                "username": user.username
            }
        }

        return JsonResponse(response_data, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
