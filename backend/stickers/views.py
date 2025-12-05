from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
import json


def board_stickers(request, board_id):
    """
    Обрабатывает GET и POST запросы для /boards/{boardId}/stickers
    GET: Получить все стикеры доски
    POST: Добавить стикер
    """
    if request.method == 'GET':
        # TODO: Implement logic to get all stickers for a board
        # Fetch stickers from database by board ID
        
        stickers = [
            # Example sticker structure
            {
                'id': 'sticker1',
                'text': 'Sample sticker text',
                'color': '#FFFF00',
                'width': 100,
                'height': 100,
                'x': 10,
                'y': 10
            }
        ]
        return JsonResponse(stickers, safe=False, status=200)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Extract sticker properties from request
            text = data.get('text')
            color = data.get('color')
            width = data.get('width')
            height = data.get('height')
            x = data.get('x')
            y = data.get('y')
            
            # TODO: Implement sticker creation logic
            # Validate input data
            # Create sticker in database for the board
            
            return JsonResponse({'message': 'Sticker created successfully'}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


def sticker_detail(request, sticker_id):
    """
    Обрабатывает PATCH and DELETE запросы для /stickers/{stickerId}
    PATCH: Изменить стикер (размер, цвет, текст, позиция)
    DELETE: Удалить стикер
    """
    if request.method == 'PATCH':
        try:
            data = json.loads(request.body)
            # Extract sticker properties that can be updated
            text = data.get('text')
            color = data.get('color')
            width = data.get('width')
            height = data.get('height')
            x = data.get('x')
            y = data.get('y')
            
            # TODO: Implement sticker update logic
            # Update sticker in database
            
            return JsonResponse({'message': 'Sticker updated successfully'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == 'DELETE':
        # TODO: Implement sticker deletion logic
        # Delete sticker from database by ID
        
        return JsonResponse({'message': 'Sticker deleted successfully'}, status=204)