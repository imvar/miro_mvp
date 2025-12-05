import uuid

from django.db import models
from boards.models import Boards

class Stickers(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4,
        primary_key=True,
        unique=True)
    content = models.TextField(max_length=100)
    color = models.TextField(max_length=6) # у нас 6 в хегсе?
    x = models.IntegerField(default=0)
    y = models.IntegerField(default=0)
    width = models.IntegerField(default=0)
    height = models.IntegerField(default=0)
    z_index = models.IntegerField(default=0)

    board_id = models.ForeignKey(
        Boards,
        on_delete=models.CASCADE  # Обязательный параметр
    )
