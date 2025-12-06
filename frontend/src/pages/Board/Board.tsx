import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Button,
  Group,
  Paper,
  LoadingOverlay,
  Alert,
  Text,
  Stack,
} from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import { api } from '../../api/axiosConfig';
import { Sticker } from './Sticker';

interface StickerType {
  id: string;
  type: 'sticker';
  content: string;
  style: {
    backgroundColor: string;
    left: string;
    top: string;
    width: string;
    height: string;
    zIndex: number;
  };
  data: {
    color: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  };
}

interface BoardData {
  id: string;
  title: string;
  description: string;
  elements: StickerType[];
  isNew?: boolean;
}

export function Board() {
  const navigate = useNavigate();
  const { boardId } = useParams();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [stickers, setStickers] = useState<StickerType[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

// Эффект для таймера повторной попытки
  useEffect(() => {
    if (error && retryCount < 3 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [error, retryCount, timeLeft]);

  // Загрузка данных доски
  // Загрузка данных доски
  const loadBoard = useCallback(async () => {
    if (!boardId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/boards/${boardId}/stickers`);
      console.log(response.data);

      const data = await response.data;
      setBoard(data.board);

      // Преобразуем строковые значения в числа для перетаскивания
      const formattedStickers = (data.board.elements || []).map((sticker: StickerType) => ({
        ...sticker,
        data: {
          ...sticker.data,
          x: typeof sticker.data.x === 'string' ? parseInt(sticker.data.x) : sticker.data.x,
          y: typeof sticker.data.y === 'string' ? parseInt(sticker.data.y) : sticker.data.y,
        }
      }));
      setStickers(formattedStickers);
    } catch (err: any) {
      console.error('Error loading board:', err);

      // Детализированная обработка ошибок
      let errorMessage = 'Не удалось загрузить доску';

      if (err.response) {
        // Ошибка от сервера
        switch (err.response.status) {
          case 404:
            errorMessage = 'Доска не найдена';
            break;
          case 403:
            errorMessage = 'У вас нет доступа к этой доске';
            break;
          case 401:
            errorMessage = 'Требуется авторизация';
            navigate('/login');
            return;
          case 500:
            errorMessage = 'Ошибка сервера. Попробуйте позже';
            break;
          default:
            errorMessage = `Ошибка сервера: ${err.response.status}`;
        }
      } else if (err.request) {
        // Запрос был сделан, но ответ не получен
        errorMessage = 'Проблемы с подключением к серверу';
      } else {
        // Ошибка настройки запроса
        errorMessage = 'Ошибка при отправке запроса';
      }

      setError(errorMessage);

      // Автоматический повтор запроса при определенных ошибках (не 404, не 403)
      if (err.response?.status !== 404 && err.response?.status !== 403 && retryCount < 3) {
        setTimeLeft(3); // Устанавливаем таймер на 3 секунды
        const timeoutId = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 3000);

        return () => clearTimeout(timeoutId);
      }
    } finally {
      setLoading(false);
    }
  }, [boardId, navigate, retryCount]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Добавление нового стикера
  const addSticker = async () => {
    try {
      const response = await api.post(`/api/boards/${boardId}/stickers`, {
        content: 'Новый стикер',
        color: '#ffeb3b',
        x: 50,
        y: 50,
        width: 150,
        height: 150,
        z_index: stickers.length
      });

      const stickerData = response.data;
      const newSticker: StickerType = {
        id: stickerData.id,
        type: 'sticker',
        content: stickerData.content,
        style: {
          backgroundColor: stickerData.color,
          left: `${stickerData.x}px`,
          top: `${stickerData.y}px`,
          width: `${stickerData.width}px`,
          height: `${stickerData.height}px`,
          zIndex: stickerData.z_index
        },
        data: {
          color: stickerData.color,
          x: stickerData.x,
          y: stickerData.y,
          width: stickerData.width,
          height: stickerData.height,
          zIndex: stickerData.z_index
        }
      };

      setStickers([...stickers, newSticker]);
      setSelectedSticker(newSticker.id);
    } catch (error) {
      console.error('Error adding sticker:', error);
    }
  };

  // Обновление текста стикера
  const updateStickerContent = async (stickerId: string, content: string) => {
    try {
      await api.patch(`/api/stickers/${stickerId}`, { content });

      setStickers(stickers.map(sticker =>
        sticker.id === stickerId
          ? {
              ...sticker,
              content,
              style: {
                ...sticker.style,
                backgroundColor: sticker.data.color
              }
            }
          : sticker
      ));
    } catch (error) {
      console.error('Error updating sticker content:', error);
    }
  };

  // Обновление позиции стикера
  const updateStickerPosition = async (stickerId: string, x: number, y: number) => {
    try {
      await api.patch(`/api/stickers/${stickerId}`, { x, y });

      setStickers(stickers.map(sticker =>
        sticker.id === stickerId
          ? {
              ...sticker,
              data: {
                ...sticker.data,
                x,
                y
              },
              style: {
                ...sticker.style,
                left: `${x}px`,
                top: `${y}px`
              }
            }
          : sticker
      ));
    } catch (error) {
      console.error('Error updating sticker position:', error);
    }
  };

  // Обновление размера стикера
  const updateStickerSize = async (stickerId: string, width: number, height: number) => {
    try {
      await api.patch(`/api/stickers/${stickerId}`, { width, height });

      setStickers(stickers.map(sticker =>
        sticker.id === stickerId
          ? {
              ...sticker,
              data: {
                ...sticker.data,
                width,
                height
              },
              style: {
                ...sticker.style,
                width: `${width}px`,
                height: `${height}px`
              }
            }
          : sticker
      ));
    } catch (error) {
      console.error('Error updating sticker size:', error);
    }
  };

  // Удаление стикера
  const deleteSticker = async (stickerId: string) => {
    try {
      await api.delete(`/api/stickers/${stickerId}`);

      setStickers(stickers.filter(sticker => sticker.id !== stickerId));
      if (selectedSticker === stickerId) {
        setSelectedSticker(null);
      }
    } catch (error) {
      console.error('Error deleting sticker:', error);
    }
  };

  // Обновление цвета стикера
  const updateStickerColor = async (stickerId: string, color: string) => {
    try {
      await api.patch(`/api/stickers/${stickerId}`, { color });

      setStickers(stickers.map(sticker =>
        sticker.id === stickerId
          ? {
              ...sticker,
              data: {
                ...sticker.data,
                color
              },
              style: {
                ...sticker.style,
                backgroundColor: color
              }
            }
          : sticker
      ));
    } catch (error) {
      console.error('Error updating sticker color:', error);
    }
  };

  // Сохранение доски (только для обновления названия/описания)
  const saveBoard = useCallback(async () => {
    if (!board) return;

    const boardData = {
      title: board.title,
      description: board.description || ''
    };

    try {
      const response = await api.post(`/api/boards/${boardId}`, boardData);
      console.log('Board saved:', response.data);
    } catch (error) {
      console.error('Error saving board:', error);
    }
  }, [board, boardId]);

  // Сохранение новой доски
  const saveNewBoard = async () => {
    await saveBoard();
    navigate('/boards');
  };

  // Автосохранение больше не нужно, так как стикеры сохраняются сразу при изменении

  // Функция для повторной попытки загрузки
  const handleRetry = () => {
    setRetryCount(0);
    loadBoard();
  };

  // Если идет загрузка
  if (loading && !error) {
    return (
      <Container size="lg" style={{ height: '100vh' }}>
        <LoadingOverlay visible={loading} />
      </Container>
    );
  }

  // Если есть ошибка
    if (error) {
    return (
        <Container size="md" pt="xl">
            <Alert
                icon={<IconAlertCircle size={16} />}
                title="Ошибка загрузки"
                color="red"
                variant="filled"
                mb="md"
            >
                <Stack gap="sm">
                {/* Вариант с inline стилем */}
                <Text style={{ color: 'white' }}>{error}</Text>

                {timeLeft > 0 && retryCount < 3 && (
                    <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Повторная попытка через {timeLeft} секунд...
                    </Text>
                )}

                {retryCount >= 3 && (
                    <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Превышено количество попыток. Проверьте подключение к интернету.
                    </Text>
                )}

                <Group mt="md">
                    <Button
                        variant="white"
                        color="dark"
                        onClick={handleRetry}
                        disabled={loading || timeLeft > 0}
                        >
                        {loading ? 'Попытка загрузки...' : 'Попробовать снова'}
                    </Button>

                    <Button
                        variant="light"
                        color="gray"
                        leftSection={<IconArrowLeft size={16} />}
                        styles={{
                            root: {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                },
                            },
                        }}
                        onClick={() => navigate('/boards')}
                    >
                        Вернуться к списку досок
                    </Button>
                </Group>
                </Stack>
            </Alert>
        </Container>
    );
  }

  // Если доска не найдена (но нет явной ошибки загрузки)
  if (!board && !loading) {
    return (
      <Container size="md" pt="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Доска не найдена"
          color="yellow"
          variant="filled"
          mb="md"
        >
          <Stack gap="sm">
            <Text>Запрошенная доска не существует или была удалена.</Text>

            <Group mt="md">
              <Button
                variant="light"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate('/boards')}
              >
                Вернуться к списку досок
              </Button>
            </Group>
          </Stack>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" p="md">
      {/* Хедер с кнопками */}
      <Group mb="md" justify="space-between">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/boards')}
          >
            К доскам
          </Button>
          <h1>{board?.title || 'Доска'}</h1>
        </Group>

        <Group>
          {board?.isNew ? (
            <Button onClick={saveNewBoard}>
              Создать доску
            </Button>
          ) : (
            <Button onClick={saveBoard}>
              Сохранить
            </Button>
          )}
          <Button onClick={addSticker}>
            Добавить стикер
          </Button>
        </Group>
      </Group>

      {/* Область доски */}
      <Paper
        style={{
          position: 'relative',
          height: 'calc(100vh - 120px)',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa'
        }}
      >
        {/* Стикеры */}
        {stickers.map((sticker) => (
          <Sticker
            key={sticker.id}
            sticker={sticker}
            isSelected={selectedSticker === sticker.id}
            onSelect={setSelectedSticker}
            onUpdateContent={updateStickerContent}
            onUpdateColor={updateStickerColor}
            onDelete={deleteSticker}
            onPositionChange={updateStickerPosition}
            onResize={updateStickerSize}
          />
        ))}
      </Paper>
    </Container>
  );
}
