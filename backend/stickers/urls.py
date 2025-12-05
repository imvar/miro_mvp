from django.urls import path
from . import views

urlpatterns = [
    path('boards/<str:board_id>/stickers', views.board_stickers, name='board_stickers'),
    path('<str:sticker_id>/', views.sticker_detail, name='sticker_detail'),
]