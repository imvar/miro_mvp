from django.urls import path
from . import views

urlpatterns = [
    path('', views.board_list, name='board_list'),  # GET and POST for boards
    path('<str:board_id>/', views.board_detail, name='board_detail'),  # GET and DELETE for specific board
    path('<str:board_id>/share', views.share_board, name='share_board'),
    path('<str:board_id>/autosave', views.autosave_board, name='autosave_board'),
]