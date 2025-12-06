import { useState } from 'react';
// import { Link } from 'react-router-dom';
import {
  ActionIcon,
  Card,
  Group,
  TextInput,
  Textarea,
  Menu,
  Stack,
  Text,
  Title,
  Loader
} from "@mantine/core";
import {
  IconClock,
  IconDotsVertical,
  IconEdit,
  IconLayoutBoard,
  IconStar,
  IconTrash,
  IconUsers
} from "@tabler/icons-react";
import { Link } from 'react-router';

interface Board {
  id: string;
  title: string;
  updatedAt: string;
  description?: string;
  isStarred?: boolean;
  membersCount?: number;
}

interface BoardCardProps {
  board: Board;
  onStarToggle: (boardId: string) => void;
  onEdit: (boardId: string, title: string, description?: string) => void;
  onDelete: (boardId: string) => void;
}

export const BoardCard = (props: BoardCardProps) => {
  const { board, onStarToggle, onEdit, onDelete } = props;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(board.title);
  const [editedDescription, setEditedDescription] = useState(board.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveEdit = async (field: 'title' | 'description' | 'both') => {
    const titleToSave = field === 'title' || field === 'both' ? editedTitle.trim() : board.title;
    const descriptionToSave = field === 'description' || field === 'both' ? editedDescription.trim() : board.description;
    
    const hasChanges = 
      (field === 'title' || field === 'both') && titleToSave !== board.title ||
      (field === 'description' || field === 'both') && descriptionToSave !== board.description;

    if (hasChanges) {
      setIsSaving(true);
      try {
        await onEdit(board.id, titleToSave, descriptionToSave);
        if (field === 'title' || field === 'both') setIsEditingTitle(false);
        if (field === 'description' || field === 'both') setIsEditingDescription(false);
      } catch (error) {
        console.error('Ошибка при сохранении:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, field: 'title' | 'description') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(field);
    } else if (e.key === 'Escape') {
      if (field === 'title') {
        setEditedTitle(board.title);
        setIsEditingTitle(false);
      } else {
        setEditedDescription(board.description || '');
        setIsEditingDescription(false);
      }
    }
  };

  const handleDescriptionBlur = () => {
    if (editedDescription.trim() !== board.description) {
      handleSaveEdit('description');
    } else {
      setIsEditingDescription(false);
    }
  };

  const handleTitleBlur = () => {
    if (editedTitle.trim() !== board.title) {
      handleSaveEdit('title');
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleDoubleClick = (field: 'title' | 'description') => {
    if (field === 'title') {
      setIsEditingTitle(true);
      setIsEditingDescription(false);
    } else {
      setIsEditingDescription(true);
      setIsEditingTitle(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дня назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  return (
    <Card
      key={board.id}
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        textDecoration: 'none',
        transition: 'transform 0.2s',
      }}
      styles={{
        root: {
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
      }}
    >
      <Card.Section
        withBorder
        inheritPadding
        py="xs"
        style={{
          backgroundColor: 'var(--mantine-color-indigo-0)',
          borderBottom: '1px solid var(--mantine-color-gray-3)',
        }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <IconLayoutBoard size={20} color="var(--mantine-color-indigo-6)" />
            <Text fw={500} size="sm" c="indigo">
              ДОСКА
            </Text>
          </Group>
          
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onStarToggle(board.id);
              }}
              color={board.isStarred ? 'yellow' : 'gray'}
            >
              <IconStar
                size={16}
                fill={board.isStarred ? 'currentColor' : 'none'}
              />
            </ActionIcon>
            
            <Menu withinPortal position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={(e) => e.preventDefault()}
                >
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditingTitle(true);
                  }}
                >
                  Редактировать название
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditingDescription(true);
                  }}
                >
                  Редактировать описание
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(board.id);
                  }}
                >
                  Удалить
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Card.Section>

      <Stack gap="xs" mt="md">
        {isEditingTitle ? (
          <TextInput
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={(e) => handleKeyPress(e, 'title')}
            onBlur={handleTitleBlur}
            autoFocus
            disabled={isSaving}
            rightSection={isSaving ? <Loader size="xs" /> : null}
            size="sm"
            placeholder="Название доски"
          />
        ) : (
          <Link to={`/board/${board.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Title
              order={4}
              lineClamp={2}
              style={{ 
                minHeight: '3.5rem',
                cursor: 'pointer'
              }}
              onDoubleClick={() => handleDoubleClick('title')}
            >
              {board.title}
            </Title>
          </Link>
        )}
        
        {isEditingDescription ? (
          <Textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            onKeyDown={(e) => handleKeyPress(e, 'description')}
            onBlur={handleDescriptionBlur}
            autoFocus
            disabled={isSaving}
            rightSection={isSaving ? <Loader size="xs" /> : null}
            size="sm"
            placeholder="Добавьте описание..."
            autosize
            minRows={2}
            maxRows={4}
            style={{ width: '100%' }}
          />
        ) : (
          board.description ? (
            <Text
              size="sm"
              c="dimmed"
              lineClamp={2}
              style={{ cursor: 'pointer', minHeight: '2.5rem' }}
              onDoubleClick={() => handleDoubleClick('description')}
            >
              {board.description}
            </Text>
          ) : (
            <Text
              size="sm"
              c="dimmed"
              style={{ 
                cursor: 'pointer',
                minHeight: '2.5rem',
                color: 'var(--mantine-color-gray-5)'
              }}
              onDoubleClick={() => handleDoubleClick('description')}
            >
              Нажмите дважды, чтобы добавить описание...
            </Text>
          )
        )}
      </Stack>

      <Group justify="space-between" mt="md">
        <Group gap="xs">
          <IconClock size={14} />
          <Text size="xs" c="dimmed">
            {formatDate(board.updatedAt)}
          </Text>
        </Group>
        
        <Group gap="xs">
          <IconUsers size={14} />
          <Text size="xs" c="dimmed">
            {board.membersCount || 1}
          </Text>
        </Group>
      </Group>
    </Card>
  );
};