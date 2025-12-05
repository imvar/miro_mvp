
from django.test import TestCase


def create_board():
    board = Boards.objects.create(title = 'Board 1')
    user = Users.objects.create_secure_user("nia", "123")
    bU = Board_Users.objects.create(board=board.get(id),user=user.get(id))
    print("bu: ", bu)



# Create your tests here.
