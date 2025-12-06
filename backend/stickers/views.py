from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
import json
import re
from .models import Stickers
from boards.models import Boards


def board_stickers(request, board_id):
    """
    Обрабатывает GET и POST запросы для /boards/{boardId}/stickers
    GET: Получить все стикеры доски
    POST: Добавить стикер
    """
    if request.method == 'GET':
        try:
            board = get_object_or_404(Boards, id=board_id)

            stickers = Stickers.objects.filter(board_id=board_id)

            stickers_list = []
            for sticker in stickers:
                stickers_list.append({
                    'id': str(sticker.id),
                    'content': sticker.content,
                    'color': sticker.color,
                    'x': sticker.x,
                    'y': sticker.y,
                    'width': sticker.width,
                    'height': sticker.height,
                    'z_index': sticker.z_index,
                    'board_id': str(sticker.board_id.id)
                })

            return JsonResponse(stickers_list, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)

            content = data.get('content', '')
            color = data.get('color', '#FFFF99')  # Default to yellow if not provided
            width = data.get('width', 100)
            height = data.get('height', 100)
            x = data.get('x', 0)
            y = data.get('y', 0)
            z_index = data.get('z_index', 0)

            if not content:
                return JsonResponse({'error': 'Content is required'}, status=400)

            if len(content) > 100:
                return JsonResponse({'error': 'Content exceeds maximum length of 100 characters'}, status=400)

            if not re.match(r'^#([A-Fa-f0-9]{6})$', color):
                return JsonResponse({'error': 'Color must be in hex format (e.g., #FF0000)'}, status=400)

            try:
                width = int(width)
                height = int(height)
                x = int(x)
                y = int(y)
                z_index = int(z_index)

                if width <= 0 or height <= 0:
                    return JsonResponse({'error': 'Width and height must be positive integers'}, status=400)
            except ValueError:
                return JsonResponse({'error': 'Width, height, x, y, and z_index must be integers'}, status=400)

            board = get_object_or_404(Boards, id=board_id)

            sticker = Stickers.objects.create(
                content=content,
                color=color,
                width=width,
                height=height,
                x=x,
                y=y,
                z_index=z_index,
                board_id=board
            )

            return JsonResponse({
                'id': str(sticker.id),
                'content': sticker.content,
                'color': sticker.color,
                'x': sticker.x,
                'y': sticker.y,
                'width': sticker.width,
                'height': sticker.height,
                'z_index': sticker.z_index
            }, status=201)
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

            content = data.get('content')
            color = data.get('color')
            width = data.get('width')
            height = data.get('height')
            x = data.get('x')
            y = data.get('y')
            z_index = data.get('z_index')

            sticker = get_object_or_404(Stickers, id=sticker_id)

            if content is not None:
                if len(content) > 100:
                    return JsonResponse({'error': 'Content exceeds maximum length of 100 characters'}, status=400)
                sticker.content = content

            # Validate color if provided
            if color is not None:
                if not re.match(r'^#([A-Fa-f0-9]{6})$', color):
                    return JsonResponse({'error': 'Color must be in hex format (e.g., #FF0000)'}, status=400)
                sticker.color = color

            if width is not None or height is not None or x is not None or y is not None or z_index is not None:
                try:
                    if width is not None:
                        width = int(width)
                        if width <= 0:
                            return JsonResponse({'error': 'Width must be a positive integer'}, status=400)
                        sticker.width = width

                    if height is not None:
                        height = int(height)
                        if height <= 0:
                            return JsonResponse({'error': 'Height must be a positive integer'}, status=400)
                        sticker.height = height

                    if x is not None:
                        sticker.x = int(x)

                    if y is not None:
                        sticker.y = int(y)

                    if z_index is not None:
                        sticker.z_index = int(z_index)

                except ValueError:
                    return JsonResponse({'error': 'Width, height, x, y, and z_index must be integers'}, status=400)

            sticker.save()

            return JsonResponse({
                'id': str(sticker.id),
                'content': sticker.content,
                'color': sticker.color,
                'x': sticker.x,
                'y': sticker.y,
                'width': sticker.width,
                'height': sticker.height,
                'z_index': sticker.z_index
            }, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == 'DELETE':
        try:
            sticker = get_object_or_404(Stickers, id=sticker_id)
            sticker.delete()

            return JsonResponse({'message': 'Sticker deleted successfully'}, status=204)
        except Stickers.DoesNotExist:
            return JsonResponse({'error': 'Sticker not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)