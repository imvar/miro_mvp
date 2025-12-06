import {
    ActionIcon,
    Button,
    Center,
    Container,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
    IconLayoutBoard,
    IconPlus,
    IconSearch
} from '@tabler/icons-react';
import { useState } from 'react';
import { useLoaderData } from 'react-router';
import { api } from '../../api/axiosConfig';
import { BoardCard } from './BoardCard';

interface Board {
  id: string;
  title: string;
  updatedAt: string;
  description?: string;
  isStarred?: boolean;
  membersCount?: number;
}

interface LoaderData {
  boards: Board[];
}

export function BoardsList() {
  const loaderData = useLoaderData() as LoaderData;
  const [boards, setBoards] = useState<Board[]>(loaderData.boards || []);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [loading, setLoading] = useState(false);

  // Фильтрация досок по поиску
  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleCreateBoard = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/boards/new', {
        title: "Новая доска",
        elements: []
      });
      const { board } = response.data;

      const newBoard: Board = {
        ...board,
        isStarred: false,
        membersCount: 1,
        updatedAt: new Date().toISOString()
      };
      
      setBoards([newBoard, ...boards]);
    } catch (error) {
      console.error('Ошибка при создании доски:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (boardId: string) => {
    try {
      // Отправляем запрос на сервер для обновления
      await api.patch(`/api/boards/${boardId}`, {
        isStarred: !boards.find(b => b.id === boardId)?.isStarred
      });
      
      // Обновляем локальное состояние
      setBoards(boards.map(board =>
        board.id === boardId ? { ...board, isStarred: !board.isStarred } : board
      ));
    } catch (error) {
      console.error('Ошибка при обновлении избранного:', error);
    }
  };

  const handleDelete = async (boardId: string) => {
    try {
      await api.delete(`/api/boards/${boardId}`);
      setBoards(boards.filter(board => board.id !== boardId));
    } catch (error) {
      console.error('Ошибка при удалении доски:', error);
    }
  };
  
    const handleEdit = async (boardId: string, title: string, description?: string) => {
        try {
            const response = await api.post(`/api/boards/${boardId}`, {
                title: title,
                description: description || '',
                elements: []
            });
            
            const { board } = response.data;
            
            setBoards(boards.map(b =>
                b.id === boardId ? { 
                    ...b, 
                    ...board, 
                    updatedAt: new Date().toISOString() 
                } : b
            ));
        } catch (error) {
            console.error('Ошибка при обновлении доски:', error);
        }
    };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Заголовок и кнопка создания */}
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              Мои доски
            </Title>
            <Text c="dimmed">
              Всего досок: {boards.length}
            </Text>
          </div>
          
          <Button
            leftSection={<IconPlus size={20} />}
            onClick={handleCreateBoard}
            size="md"
            loading={loading}
          >
            Создать доску
          </Button>
        </Group>

        {/* Поиск */}
        <Paper withBorder p="sm" radius="md">
          <TextInput
            placeholder="Поиск досок..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftSection={<IconSearch size={18} />}
            rightSection={search && (
              <ActionIcon
                variant="subtle"
                onClick={() => setSearch('')}
              >
                ✕
              </ActionIcon>
            )}
            variant="unstyled"
          />
        </Paper>

        {/* Список досок */}
        {loading && filteredBoards.length === 0 ? (
          <Center h={200}>
            <Loader size="lg" />
          </Center>
        ) : filteredBoards.length === 0 ? (
          <Center h={200}>
            <Stack align="center" gap="md">
              <IconLayoutBoard size={48} color="gray" />
              <Text size="lg" c="dimmed">
                {search ? 'Доски не найдены' : 'У вас пока нет досок'}
              </Text>
              {!search && (
                <Button
                  leftSection={<IconPlus size={20} />}
                  onClick={handleCreateBoard}
                  loading={loading}
                >
                  Создать первую доску
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
            {filteredBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onStarToggle={toggleStar}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}