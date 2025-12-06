from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.conf import settings
import json

# Import views from various apps
from auth_app.views import register as auth_register_view
from auth_app.views import login as auth_login_view
from boards.views import board_list as boards_list_create_view
from boards.views import board_detail as board_detail_delete_view
from boards.views import share_board as board_share_view
from boards.views import autosave_board as board_autosave_view
from boards.views import get_user_id_from_request
from stickers.views import board_stickers as board_stickers_list_create_view
from stickers.views import sticker_detail as sticker_detail_view
from auth_app.models import User

from boards.tests import create_board


def get_user_profile(request):
    """Handle GET /api/user/profile"""
    # Extract token from Authorization header (Bearer token)
    try:
        user_id = get_user_id_from_request(request)

        if not user_id:
            return JsonResponse({'error': 'Invalid token: no user ID'}, status=401)

        # Get the user from database
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)

        # Return user profile
        return JsonResponse({
            'id': str(user.id),
            'username': user.username,
            'name': user.username  # для совместимости с фронтендом
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=401)


@csrf_exempt
def auth_register(request):
    """Handle auth register"""
    return auth_register_view(request)


@csrf_exempt
def auth_login(request):
    """Handle auth login"""
    return auth_login_view(request)


@csrf_exempt
def boards_list_create(request):
    """Handle boards list (GET)"""
    if request.method == 'GET':
        return boards_list_create_view(request)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def board_create_new(request):
    """Handle board creation for /boards/new (POST)"""
    if request.method == 'POST':
        return boards_list_create_view(request)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def board_detail_delete(request, board_id):
    """Handle board detail (GET) and delete (DELETE)"""
    return board_detail_delete_view(request, board_id)


@csrf_exempt
def board_share(request, board_id):
    """Handle board share"""
    return board_share_view(request, board_id)


@csrf_exempt
def board_autosave(request, board_id):
    """Handle board autosave"""
    return board_autosave_view(request, board_id)


@csrf_exempt
def board_stickers_list_create(request, board_id):
    """Handle board stickers list (GET) and create (POST)"""
    return board_stickers_list_create_view(request, board_id)


@csrf_exempt
def sticker_detail(request, sticker_id):
    """
    Handle sticker detail - PATCH and DELETE methods
    Maps to stickers/{stickerId} endpoint
    """
    return sticker_detail_view(request, sticker_id)
