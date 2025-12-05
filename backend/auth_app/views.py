from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    """
    Регистрация пользователя
    POST /auth/register
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        # TODO: Implement user registration logic
        # Validate input data
        # Create user in database
        
        return JsonResponse({'message': 'User registered successfully'}, status=201)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """
    Вход в систему
    POST /auth/login
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        # TODO: Implement login logic
        # Validate credentials
        # Generate JWT token
        
        response_data = {
            'accessToken': 'fake_jwt_token_here'  # Replace with actual token
        }
        return JsonResponse(response_data, status=200)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)