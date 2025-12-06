from django.urls import path, include
from . import views

urlpatterns = [
    # Auth endpoints
    path('auth/register', views.auth_register, name='auth_register'),
    path('auth/login', views.auth_login, name='auth_login'),

    # User profile endpoint
    path('user/profile', views.get_user_profile, name='user_profile'),

    # Boards endpoints
    path('boards', views.boards_list_create, name='boards_list_create'),
    path('boards/new', views.board_create_new, name='board_create_new'),
    path('boards/<str:board_id>', views.board_detail_delete, name='board_detail_delete'),
    path('boards/<str:board_id>/share', views.board_share, name='board_share'),
    path('boards/<str:board_id>/autosave', views.board_autosave, name='board_autosave'),

    # Stickers endpoints
    path('boards/<str:board_id>/stickers', views.board_stickers_list_create, name='board_stickers_list_create'),
    path('stickers/<str:sticker_id>', views.sticker_detail, name='sticker_detail'),
]
