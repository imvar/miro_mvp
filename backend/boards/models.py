import uuid

from django.db import models

from backend import *
from auth_app.models import User


class Boards(models.Model):

    id = models.UUIDField(
        default=uuid.uuid4,
        primary_key=True,
        unique=True)
    title = models.CharField(max_length=100)


class Board_Users(models.Model):
    user_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,  # Обязательный парамет
    )
    board_id = models.ForeignKey(
        Boards,
        on_delete=models.CASCADE  # Обязательный параметр
    )