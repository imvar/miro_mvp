from django.test import TestCase, Client
from django.urls import reverse
from .models import Stickers
from boards.models import Boards
import json
import uuid

class StickersTestCase(TestCase):
    def setUp(self):
        # Create a test board
        self.board = Boards.objects.create(
            title="Test Board"
        )
        self.client = Client()

    def test_create_sticker(self):
        """Test creating a new sticker"""
        url = reverse('board_stickers_list_create', args=[self.board.id])
        data = {
            'content': 'Test sticker content',
            'color': '#FF0000',
            'x': 10,
            'y': 20,
            'width': 100,
            'height': 100,
            'z_index': 1
        }

        response = self.client.post(
            url,
            json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Stickers.objects.count(), 1)

        sticker = Stickers.objects.first()
        self.assertEqual(sticker.content, 'Test sticker content')
        self.assertEqual(sticker.color, '#FF0000')

    def test_get_board_stickers(self):
        """Test retrieving all stickers for a board"""
        # Create a sticker first
        sticker = Stickers.objects.create(
            content='Test sticker',
            color='#00FF00',
            x=5,
            y=10,
            width=200,
            height=150,
            z_index=2,
            board_id=self.board
        )

        url = reverse('board_stickers_list_create', args=[self.board.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

        returned_sticker = response.json()[0]
        self.assertEqual(returned_sticker['content'], 'Test sticker')
        self.assertEqual(returned_sticker['color'], '#00FF00')

    def test_update_sticker(self):
        """Test updating a sticker"""
        # Create a sticker first
        sticker = Stickers.objects.create(
            content='Original content',
            color='#0000FF',
            x=0,
            y=0,
            width=100,
            height=100,
            z_index=0,
            board_id=self.board
        )

        url = reverse('sticker_detail', args=[sticker.id])
        data = {
            'content': 'Updated content',
            'color': '#FFFFFF',
            'x': 30,
            'y': 40,
            'width': 150,
            'height': 120,
            'z_index': 5
        }

        response = self.client.patch(
            url,
            json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)

        # Refresh from DB
        sticker.refresh_from_db()
        self.assertEqual(sticker.content, 'Updated content')
        self.assertEqual(sticker.color, '#FFFFFF')

    def test_delete_sticker(self):
        """Test deleting a sticker"""
        # Create a sticker first
        sticker = Stickers.objects.create(
            content='To be deleted',
            color='#FFFF00',
            x=0,
            y=0,
            width=100,
            height=100,
            z_index=0,
            board_id=self.board
        )

        url = reverse('sticker_detail', args=[sticker.id])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, 204)
        self.assertEqual(Stickers.objects.count(), 0)
