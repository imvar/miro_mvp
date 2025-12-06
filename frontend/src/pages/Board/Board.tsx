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
  const addSticker = () => {
    const newSticker: StickerType = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      content: 'Новый стикер',
      style: {
        backgroundColor: '#ffeb3b',
        left: '50px',
        top: '50px',
        width: '150px',
        height: '150px',
        zIndex: stickers.length
      },
      data: {
        color: '#ffeb3b',
        x: 50,
        y: 50,
        width: 150,
        height: 150,
        zIndex: stickers.length
      }
    };
    
    setStickers([...stickers, newSticker]);
    setSelectedSticker(newSticker.id);
  };

  // Обновление текста стикера
  const updateStickerContent = (stickerId: string, content: string) => {
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
  };

  // Обновление позиции стикера
  const updateStickerPosition = (stickerId: string, x: number, y: number) => {
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
  };

  // Обновление размера стикера
  const updateStickerSize = (stickerId: string, width: number, height: number) => {
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
  };

  // Удаление стикера
  const deleteSticker = (stickerId: string) => {
    setStickers(stickers.filter(sticker => sticker.id !== stickerId));
    if (selectedSticker === stickerId) {
      setSelectedSticker(null);
    }
  };

  // Сохранение доски
  const saveBoard = useCallback(async () => {
    if (!board) return;

    const boardData = {
      title: board.title,
      description: board.description || '',
      elements: stickers.map(sticker => ({
        ...sticker,
        style: {
          ...sticker.style,
          left: `${sticker.data.x}px`,
          top: `${sticker.data.y}px`,
          width: `${sticker.data.width}px`,
          height: `${sticker.data.height}px`,
          backgroundColor: sticker.data.color
        }
      }))
    };

    try {
      const response = await api.post(`/api/boards/${boardId}`, boardData);
      console.log('Board saved:', response.data);
    } catch (error) {
      console.error('Error saving board:', error);
      // Можно добавить обработку ошибок сохранения
    }
  }, [board, stickers, boardId]);

  // Автосохранение при изменении стикеров
  useEffect(() => {
    if (stickers.length > 0 && board && !board.isNew) {
      const timeoutId = setTimeout(() => {
        saveBoard();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [stickers, board, saveBoard]);

  // Сохранение новой доски
  const saveNewBoard = async () => {
    await saveBoard();
    navigate('/boards');
  };

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
                <Stack spacing="sm">
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
                        leftIcon={<IconArrowLeft size={16} />}
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
          <Stack spacing="sm">
            <Text>Запрошенная доска не существует или была удалена.</Text>
            
            <Group mt="md">
              <Button 
                variant="light" 
                leftIcon={<IconArrowLeft size={16} />}
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
      <Group mb="md" position="apart">
        <Group>
          <Button
            variant="subtle"
            leftIcon={<IconArrowLeft size={16} />}
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
            onDelete={deleteSticker}
            onPositionChange={updateStickerPosition}
            onResize={updateStickerSize} 
          />
        ))}
      </Paper>
    </Container>
  );
}