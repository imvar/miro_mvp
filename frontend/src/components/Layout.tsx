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
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { api } from '../api/axiosConfig';

interface Board {
  id: number;
  title: string;
  updated_at: string;
}

export function Layout() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  // Моковые данные пользователя
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');


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

      navigate(`/board/${board.id}`);
    } catch (error) {
      console.error('Ошибка при создании доски:', error);
    } finally {
      setLoading(false);
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
             {/* <Tooltip label="Поиск">
              <ActionIcon
                variant="light"
                size="lg"
                aria-label="Поиск"
              >
                <IconSearch size={20} />
              </ActionIcon>
            </Tooltip> */}

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

            {/* Все доски */}
            <MantineNavLink
              component={NavLink}
              to="/boards"
              label="Все доски"
              leftSection={<IconLayoutBoard size={16} />}
              rightSection={<IconChevronRight size={16} />}
              variant="light"
            />
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
