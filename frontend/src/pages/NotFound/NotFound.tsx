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
        <Stack align="center" spacing="lg">
          <IconAlertCircle size={120} color="#fa5252" stroke={1} />
          
          <Stack spacing="xs" align="center">
            <Title order={1} style={{ fontSize: '4rem', fontWeight: 900 }}>
              404
            </Title>
            <Title order={2} color="dimmed">
              Страница не найдена
            </Title>
            <Text color="dimmed" align="center" style={{ maxWidth: 500 }}>
                Запрошенная страница не существует или была перемещена. 
                Проверьте правильность URL или вернитесь на главную страницу.
            </Text>
          </Stack>

          <Group position="center" spacing="md" mt="xl">
              <Button
                size="md"
                leftIcon={<IconArrowLeft size={18} />}
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Назад
              </Button>
              <Button
                size="md"
                leftIcon={<IconHome size={18} />}
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

// По умолчанию экспортируем основной компонент
export default NotFoundPage;