from django.urls import path
from . import views

urlpatterns = [
    path('', views.sticker_detail, name='sticker_detail'),
]