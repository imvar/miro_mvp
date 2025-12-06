from django.contrib import admin
from .models import Boards, Board_Users


@admin.register(Boards)
class BoardsAdmin(admin.ModelAdmin):
    list_display = ('id', 'title')
    search_fields = ('title',)
    list_filter = ('title',)


@admin.register(Board_Users)
class Board_UsersAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'board_id')
    search_fields = ('user_id__username', 'board_id__title')
    list_filter = ('board_id',)
