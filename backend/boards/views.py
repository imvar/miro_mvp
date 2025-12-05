from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
import json


def board_list(request):
    """
    Обрабатывает GET и POST запросы для /boards
    GET: Получить список всех доступных досок
    POST: Создать новую доску
    """
    if request.method == 'GET':
        # TODO: Implement logic to get all accessible boards
        # Return list of boards from database

        boards = [
            # Example board structure
            {
                'id': 'board1',
                'title': 'Sample Board',
                'ownerId': 'user1',
                'shared': False
            }
        ]
        return JsonResponse(boards, safe=False, status=200)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            title = data.get('title')

            # TODO: Implement board creation logic
            # Validate input data
            # Create board in database

            return JsonResponse({'message': 'Board created successfully'}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


def board_detail(request, board_id):
    """
    Обрабатывает GET и DELETE запросы для /boards/{boardId}
    GET: Получить одну доску
    DELETE: Удалить доску
    """
    if request.method == 'GET':
        # TODO: Implement logic to get a specific board
        # Fetch board from database by ID

        board = {
            'id': board_id,
            'title': 'Sample Board Title',
            'ownerId': 'user1',
            'shared': False
        }
        return JsonResponse(board, status=200)

    elif request.method == 'DELETE':
        # TODO: Implement board deletion logic
        # Delete board from database by ID

        return JsonResponse({'message': 'Board deleted successfully'}, status=204)


@csrf_exempt
def share_board(request, board_id):
    """
    Поделиться доской с другим пользователем
    POST /boards/{boardId}/share
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_email = data.get('userEmail')

            # TODO: Implement board sharing logic
            # Validate input data
            # Share board with user by email

            return JsonResponse({'message': 'Board shared successfully'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def autosave_board(request, board_id):
    """
    Автоматическое сохранение состояния доски
    POST /boards/{boardId}/autosave
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            board_state = data.get('boardState')  # Contains stickers array

            # TODO: Implement autosave logic
            # Save board state to database

            return JsonResponse({'message': 'Board state saved successfully'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)