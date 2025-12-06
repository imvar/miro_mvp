import { useState, useEffect } from 'react';
import {
  AppShell,
  Text,
  Burger,
  Group,
  ActionIcon,
  Avatar,
  Menu,
  Stack,
  Box,
  ScrollArea,
  Divider,
  Button,
  Tooltip,
  Title,
  useMantineColorScheme,
  NavLink as MantineNavLink,
} from '@mantine/core';
import {
  IconLayoutBoard,
  IconPlus,
  IconLogout,
  IconSun,
  IconMoon,
  IconUser,
  IconSettings,
  IconBrandGithub,
  IconBell,
  IconSearch,
  IconChevronRight,
  IconHome,
  IconStar,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { api } from '../api/axiosConfig';

interface Board {
  id: number;
  title: string;
  updated_at: string;
  is_starred?: boolean;
}

export function Layout() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [recentBoards, setRecentBoards] = useState<Board[]>([]);
  const [starredBoards, setStarredBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  
  // Моковые данные пользователя
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const fetchBoards = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Загружаем последние доски
      const recentResponse = await api.get('/api/recent', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (recentResponse.status === 200) {
        setRecentBoards(recentResponse.data.boards || []);
      }
      
      // Загружаем избранные доски
      const starredResponse = await api.get('/api/starred', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (starredResponse.status === 200) {
        setStarredBoards(starredResponse.data.boards || []);
      }
    } catch (error) {
      console.error('Ошибка при загрузке досок:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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
  
      navigate(`/board/${board.id}`);
    } catch (error) {
      console.error('Ошибка при создании доски:', error);
    } finally {
      setLoading(false);
    }

  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      if (diffHours === 0) return 'Только что';
      if (diffHours === 1) return '1 час назад';
      return `${diffHours} часа назад`;
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дня назад`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} неделю назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const navLinks = [
    { label: 'Все доски', icon: <IconLayoutBoard size={20} />, path: '/boards' },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      {/* Header - теперь через AppShell.Header */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
            />
            
            <Group gap="xs">
              <IconLayoutBoard size={28} color="var(--mantine-color-indigo-6)" />
              <Title order={3} size="h4">
                MiroClone
              </Title>
            </Group>

            <Group ml="xl" gap="xs" visibleFrom="sm">
              {navLinks.map((link) => (
                <Button
                  key={link.label}
                  variant="subtle"
                  component={NavLink}
                  to={link.path}
                  leftSection={link.icon}
                  styles={(theme) => ({
                    root: {
                      '&[data-active]': {
                        backgroundColor: theme.colors.indigo[6],
                        color: theme.white,
                      },
                    },
                  })}
                >
                  {link.label}
                </Button>
              ))}
            </Group>
          </Group>

          <Group>
            <Tooltip label="Поиск">
              <ActionIcon
                variant="light"
                size="lg"
                aria-label="Поиск"
              >
                <IconSearch size={20} />
              </ActionIcon>
            </Tooltip>

            {/* <Tooltip label="Уведомления">
              <ActionIcon
                variant="light"
                size="lg"
                aria-label="Уведомления"
              >
                <IconBell size={20} />
              </ActionIcon>
            </Tooltip> */}

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={() => toggleColorScheme()}
                  aria-label="Переключить тему"
                >
                  {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
                </ActionIcon>
              </Menu.Target>
              {/* <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconSun size={16} />}
                  onClick={() => toggleColorScheme()}
                >
                  Светлая тема
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconMoon size={16} />}
                  onClick={() => toggleColorScheme()}
                >
                  Тёмная тема
                </Menu.Item>
              </Menu.Dropdown> */}
            </Menu>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Group gap="xs" style={{ cursor: 'pointer' }}>
                  <Avatar
                    src={user.avatar}
                    radius="xl"
                    color="indigo"
                    name={user.username || 'Пользователь'}
                  >
                    {user.username?.charAt(0) || 'П'}
                  </Avatar>
                </Group>
              </Menu.Target>
              
              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="sm" fw={500}>{user.username || 'Пользователь'}</Text>
                  <Text size="xs" c="dimmed">{user.username || 'user@example.com'}</Text>
                </Menu.Label>
                
                <Divider />
                
                <Menu.Item
                  leftSection={<IconUser size={16} />}
                  component={NavLink}
                  to="/profile"
                >
                  Профиль
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconSettings size={16} />}
                  component={NavLink}
                  to="/settings"
                >
                  Настройки
                </Menu.Item>
                
                <Divider />
                
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={handleLogout}
                >
                  Выйти
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" fw={500} c="dimmed">РАБОЧИЕ ПРОСТРАНСТВА</Text>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={handleCreateBoard}
              >
                Новая доска
              </Button>
            </Group>

            {/* Избранные доски */}
            {!loading && starredBoards.length > 0 && (
              <>
                <Text size="sm" fw={500} c="dimmed" mt="xs">ИЗБРАННОЕ</Text>
                {starredBoards.map((board) => (
                  <MantineNavLink
                    key={board.id}
                    component={NavLink}
                    to={`/board/${board.id}`}
                    label={board.title}
                    leftSection={<IconStar size={16} color="yellow" fill="yellow" />}
                    rightSection={<IconChevronRight size={16} />}
                    variant="light"
                  />
                ))}
              </>
            )}

            {/* Недавние доски */}
            {!loading && recentBoards.length > 0 && (
              <>
                <Text size="sm" fw={500} c="dimmed" mt="xs">ПОСЛЕДНИЕ</Text>
                {recentBoards.map((board) => (
                  <MantineNavLink
                    key={board.id}
                    component={NavLink}
                    to={`/board/${board.id}`}
                    label={
                      <Box>
                        <Text size="sm">{board.title}</Text>
                        <Text size="xs" c="dimmed">{formatDate(board.updated_at)}</Text>
                      </Box>
                    }
                    leftSection={<IconLayoutBoard size={16} />}
                    rightSection={<IconChevronRight size={16} />}
                  />
                ))}
              </>
            )}

            {/* Все доски */}
            <MantineNavLink
              component={NavLink}
              to="/boards"
              label="Все доски"
              leftSection={<IconLayoutBoard size={16} />}
              rightSection={<IconChevronRight size={16} />}
              variant="light"
            />

            {loading && (
              <Text size="sm" c="dimmed" ta="center">Загрузка досок...</Text>
            )}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider my="md" />
          <Group justify="space-between">
          </Group>
          
          <Group justify="center" mt="md">
            <ActionIcon
              component="a"
              href="https://github.com"
              target="_blank"
              variant="subtle"
              size="lg"
              aria-label="GitHub"
            >
              <IconBrandGithub size={20} />
            </ActionIcon>
          </Group>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Основное содержимое */}
      <AppShell.Main>
        <Box p={0}>
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

export default Layout;