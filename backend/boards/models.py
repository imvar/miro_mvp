import uuid

from django.db import models, IntegrityError
from auth_app.models import User


class BoardsManager(models.Manager):
    def create_board(self, title, owner, description=''):
        board_id = uuid.uuid4()
        try:
            board = self.create(
                id=board_id,
                title=title,
                description=description
            )

            Board_Users.objects.create(
                user_id=owner,
                board_id=board
            )
            return board
        except IntegrityError:
            raise IntegrityError("Board creation failed")


class Boards(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4,
        primary_key=True,
        unique=True)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')

    objects = BoardsManager()

    def __str__(self):
        return self.title


class Board_Users(models.Model):
    user_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
    )
    board_id = models.ForeignKey(
        Boards,
        on_delete=models.CASCADE
    )

    class Meta:
        unique_together = [['user_id', 'board_id']]

    def __str__(self):
        return f"{self.user_id.username} - {self.board_id.title}"
