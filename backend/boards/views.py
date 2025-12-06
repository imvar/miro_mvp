from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
import json
import uuid

from .models import Boards, Board_Users
from auth_app.models import User


def get_user_id_from_request(request):
    """Получить user_id из заголовка, query параметров или тела запроса"""
    # Сначала проверяем заголовок
    user_id = request.headers.get('X-User-Id')
    if user_id:
        try:
            return uuid.UUID(user_id)
        except (ValueError, TypeError):
            pass

    # Проверяем query параметры (для GET запросов)
    user_id_str = request.GET.get('userId') or request.GET.get('user_id')
    if user_id_str:
        try:
            return uuid.UUID(user_id_str)
        except (ValueError, TypeError):
            pass

    # Если нет в заголовке и query, проверяем тело запроса (для POST/PUT/PATCH)
    if request.body:
        try:
            data = json.loads(request.body)
            user_id_str = data.get('userId') or data.get('user_id')
            if user_id_str:
                return uuid.UUID(user_id_str)
        except (json.JSONDecodeError, ValueError, TypeError):
            pass

    return None


@csrf_exempt
def board_list(request):
    """
    Обрабатывает GET и POST запросы для /boards
    GET: Получить список всех доступных досок пользователя
    POST: Создать новую доску
    """
    if request.method == 'GET':
        try:
            user_id = get_user_id_from_request(request)
            if not user_id:
                return JsonResponse({'error': 'User ID required'}, status=400)

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=404)

            # Получаем все доски пользователя через Board_Users
            board_users = Board_Users.objects.filter(user_id=user)
            boards = []

            for board_user in board_users:
                board = board_user.board_id
                # Определяем, является ли пользователь владельцем (первым в списке)
                is_owner = Board_Users.objects.filter(
                    board_id=board
                ).order_by('id').first().user_id == user

                boards.append({
                    'id': str(board.id),
                    'title': board.title,
                    'description': board.description,
                    'ownerId': str(user.id) if is_owner else None,
                    'shared': not is_owner
                })

            return JsonResponse(boards, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            title = data.get('title')
            description = data.get('description', '')
            user_id = get_user_id_from_request(request)

            if not title:
                return JsonResponse({'error': 'Title is required'}, status=400)

            if not user_id:
                return JsonResponse({'error': 'User ID required'}, status=400)

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=404)

            # Используем кастомный менеджер для создания доски
            board = Boards.objects.create_board(title=title, owner=user, description=description)

            return JsonResponse({
                'id': str(board.id),
                'title': board.title,
                'description': board.description,
                'message': 'Board created successfully'
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except IntegrityError:
            return JsonResponse({'error': 'Board creation failed'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def board_detail(request, board_id):
    """
    Обрабатывает GET и DELETE запросы для /boards/{boardId}
    GET: Получить одну доску
    DELETE: Удалить доску
    """
    try:
        board_uuid = uuid.UUID(board_id)
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid board ID format'}, status=400)

    if request.method == 'GET':
        try:
            board = get_object_or_404(Boards, id=board_uuid)
            user_id = get_user_id_from_request(request)

            # Проверяем доступ пользователя к доске
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    has_access = Board_Users.objects.filter(
                        user_id=user,
                        board_id=board
                    ).exists()
                    if not has_access:
                        return JsonResponse({'error': 'Access denied'}, status=403)
                except User.DoesNotExist:
                    return JsonResponse({'error': 'User not found'}, status=404)

            # Определяем владельца (первый пользователь в Board_Users)
            first_board_user = Board_Users.objects.filter(
                board_id=board
            ).order_by('id').first()

            owner_id = str(first_board_user.user_id.id) if first_board_user else None

            board_data = {
                'id': str(board.id),
                'title': board.title,
                'description': board.description,
                'ownerId': owner_id,
                'shared': False
            }

            return JsonResponse(board_data, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    elif request.method == 'DELETE':
        try:
            board = get_object_or_404(Boards, id=board_uuid)
            user_id = get_user_id_from_request(request)

            if not user_id:
                return JsonResponse({'error': 'User ID required'}, status=400)

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=404)

            # Проверяем, является ли пользователь владельцем
            first_board_user = Board_Users.objects.filter(
                board_id=board
            ).order_by('id').first()

            if not first_board_user or first_board_user.user_id != user:
                return JsonResponse({'error': 'Only owner can delete board'}, status=403)

            board.delete()  # CASCADE удалит все связанные Board_Users

            return JsonResponse({'message': 'Board deleted successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def share_board(request, board_id):
    """
    Поделиться доской с другим пользователем
    POST /boards/{boardId}/share
    {
        "userEmail": "user@example.com" или "username": "username"
    }
    """
    if request.method == 'POST':
        try:
            board_uuid = uuid.UUID(board_id)
        except (ValueError, TypeError):
            return JsonResponse({'error': 'Invalid board ID format'}, status=400)

        try:
            data = json.loads(request.body)
            user_email = data.get('userEmail')
            username = data.get('username')

            if not user_email and not username:
                return JsonResponse({'error': 'userEmail or username required'}, status=400)

            # Получаем доску
            board = get_object_or_404(Boards, id=board_uuid)

            # Получаем текущего пользователя (кто делится)
            current_user_id = get_user_id_from_request(request)
            if not current_user_id:
                return JsonResponse({'error': 'User ID required'}, status=400)

            try:
                current_user = User.objects.get(id=current_user_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=404)

            # Проверяем доступ текущего пользователя к доске
            has_access = Board_Users.objects.filter(
                user_id=current_user,
                board_id=board
            ).exists()
            if not has_access:
                return JsonResponse({'error': 'Access denied'}, status=403)

            # Ищем пользователя для шаринга (по username, так как email нет в модели)
            if username:
                try:
                    target_user = User.objects.get(username=username)
                except User.DoesNotExist:
                    return JsonResponse({'error': 'User not found'}, status=404)
            else:
                # Если передан email, но в модели только username, используем email как username
                try:
                    target_user = User.objects.get(username=user_email)
                except User.DoesNotExist:
                    return JsonResponse({'error': 'User not found'}, status=404)

            # Проверяем, не добавлен ли уже пользователь
            if Board_Users.objects.filter(user_id=target_user, board_id=board).exists():
                return JsonResponse({'error': 'User already has access to this board'}, status=409)

            # Добавляем пользователя к доске
            Board_Users.objects.create(
                user_id=target_user,
                board_id=board
            )

            return JsonResponse({'message': 'Board shared successfully'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except IntegrityError:
            return JsonResponse({'error': 'Failed to share board'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def autosave_board(request, board_id):
    """
    Автоматическое сохранение состояния доски
    POST /boards/{boardId}/autosave
    {
        "boardState": {...}  # Contains stickers array
    }
    """
    if request.method == 'POST':
        try:
            board_uuid = uuid.UUID(board_id)
        except (ValueError, TypeError):
            return JsonResponse({'error': 'Invalid board ID format'}, status=400)

        try:
            data = json.loads(request.body)
            board_state = data.get('boardState')  # Contains stickers array

            if board_state is None:
                return JsonResponse({'error': 'boardState is required'}, status=400)

            # Получаем доску
            board = get_object_or_404(Boards, id=board_uuid)

            # Проверяем доступ пользователя
            user_id = get_user_id_from_request(request)
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    has_access = Board_Users.objects.filter(
                        user_id=user,
                        board_id=board
                    ).exists()
                    if not has_access:
                        return JsonResponse({'error': 'Access denied'}, status=403)
                except User.DoesNotExist:
                    return JsonResponse({'error': 'User not found'}, status=404)

            # TODO: Реализовать сохранение состояния доски
            # Это будет связано с моделями стикеров (stickers app)
            # Пока просто возвращаем успешный ответ

            return JsonResponse({'message': 'Board state saved successfully'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
