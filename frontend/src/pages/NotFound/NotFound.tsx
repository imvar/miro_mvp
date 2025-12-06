import {
  Button,
  Center,
  Container,
  Group,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { IconAlertCircle, IconArrowLeft, IconHome } from '@tabler/icons-react';
import { useNavigate } from 'react-router';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container size="md" style={{ height: '100vh' }}>
      <Center style={{ height: '100%' }}>
        <Stack align="center" gap="lg">
          <IconAlertCircle size={120} color="#fa5252" stroke={1} />

          <Stack gap="xs" align="center">
            <Title order={1} style={{ fontSize: '4rem', fontWeight: 900 }}>
              404
            </Title>
            <Title order={2} c="dimmed">
              Страница не найдена
            </Title>
            <Text c="dimmed" ta="center" style={{ maxWidth: 500 }}>
              Запрошенная страница не существует или была перемещена.
              Проверьте правильность URL или вернитесь на главную страницу.
            </Text>
          </Stack>

          <Group justify="center" gap="md" mt="xl">
            <Button
              size="md"
              leftSection={<IconArrowLeft size={18} />}
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Назад
            </Button>
            <Button
              size="md"
              leftSection={<IconHome size={18} />}
              onClick={() => navigate('/')}
            >
              На главную
            </Button>
          </Group>
        </Stack>
      </Center>
    </Container>
  );
}

export default NotFoundPage;
