from django.views.decorators.csrf import csrf_exempt

# Import views from various apps
from auth_app.views import register as auth_register_view
from auth_app.views import login as auth_login_view
from boards.views import board_list as boards_list_create_view
from boards.views import board_detail as board_detail_delete_view
from boards.views import share_board as board_share_view
from boards.views import autosave_board as board_autosave_view
from stickers.views import board_stickers as board_stickers_list_create_view
from stickers.views import sticker_detail as sticker_detail_view

from boards.tests import create_board

@csrf_exempt
def auth_register(request):
    """Handle auth register"""
    return auth_register_view(request)


@csrf_exempt
def auth_login(request):
    """Handle auth login"""

    create_board()
    return auth_login_view(request)


def boards_list_create(request):
    """Handle boards list (GET) and create (POST)"""
    return boards_list_create_view(request)


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


def board_stickers_list_create(request, board_id):
    """Handle board stickers list (GET) and create (POST)"""
    return board_stickers_list_create_view(request, board_id)


def sticker_detail(request, sticker_id):
    """
    Handle sticker detail - PATCH and DELETE methods
    Maps to stickers/{stickerId} endpoint
    """
    return sticker_detail_view(request, sticker_id)