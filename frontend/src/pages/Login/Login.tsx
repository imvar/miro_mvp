import { useNavigate } from 'react-router';
import {
    Alert,
    Anchor,
    Button,
    Container,
    Loader,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { api } from '../../api/axiosConfig';

// Типы для данных формы
interface LoginFormValues {
  username: string;
  password: string;
}

interface RegisterFormValues extends LoginFormValues {
  name?: string;
}

export function Login() {
  const navigate = useNavigate(); // Добавляем навигацию
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);  

  // Форма для логина
  const loginForm = useForm<LoginFormValues>({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (value.length < 3 ? 'Имя пользователя должно содержать минимум 3 символа' : null),
      password: (value) => (value.length < 6 ? 'Пароль должен содержать минимум 6 символов' : null),
    },
  });

  // Форма для регистрации
  const registerForm = useForm<RegisterFormValues>({
    initialValues: {
      name: '',
      username: '',
      password: '',
    },
    validate: {
      name: (value) => (!isLoginMode && value.length < 2 ? 'Имя должно содержать минимум 2 символа' : null),
      username: (value) => (value.length < 3 ? 'Имя пользователя должно содержать минимум 3 символа' : null),
      password: (value) => (value.length < 6 ? 'Пароль должен содержать минимум 6 символов' : null),
    },
  });

  const handleLogin = async (event: React.FormEvent, values: LoginFormValues) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/api/auth/login', {
        username: values.username,
        password: values.password
      });
      
      // Сохраняем токен
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setSuccess('Успешный вход! Перенаправление...');
      
      // Используем навигацию вместо перезагрузки
      setTimeout(() => {
        navigate('/boards', { replace: true });
      }, 1000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/api/auth/register', {
        username: values.username,
        password: values.password
      });
      
      // Если регистрация успешна, автоматически входим
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setSuccess('Регистрация успешна! Перенаправление...');
      
      // Переходим на главную страницу
      setTimeout(() => {
        navigate('/boards', { replace: true });
      }, 1000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (isLoginMode) {
      const values = loginForm.values;
      if (loginForm.validate().hasErrors) return;
      handleLogin(event, values as LoginFormValues);
    } else {
      const values = registerForm.values;
      if (registerForm.validate().hasErrors) return;
      handleRegister(values as RegisterFormValues);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setSuccess(null);
    // Сбрасываем формы при переключении режима
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <Container size={420} my={40}>
      <Title
        align="center"
        sx={(theme) => ({
          fontFamily: `Greycliff CF, ${theme.fontFamily}`,
          fontWeight: 900,
        })}
      >
        {isLoginMode ? 'Добро пожаловать!' : 'Создайте аккаунт'}
      </Title>
      
      <Text color="dimmed" size="sm" align="center" mt={5}>
        {isLoginMode ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
        <Anchor size="sm" component="button" onClick={toggleMode}>
          {isLoginMode ? 'Зарегистрироваться' : 'Войти'}
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            {error && (
              <Alert 
                icon={<IconAlertCircle size="1rem" />} 
                title="Ошибка!" 
                color="red"
                variant="filled"
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert 
                icon={<IconCheck size="1rem" />} 
                title="Успешно!" 
                color="green"
                variant="filled"
              >
                {success}
              </Alert>
            )}

            {!isLoginMode && (
              <TextInput
                label="Имя"
                placeholder="Ваше имя"
                {...registerForm.getInputProps('name')}
              />
            )}

            <TextInput
              label="Имя пользователя"
              placeholder="Ваш логин"
              required
              {...(isLoginMode 
                ? loginForm.getInputProps('username')
                : registerForm.getInputProps('username')
              )}
            />

            <PasswordInput
              label="Пароль"
              placeholder="Ваш пароль"
              required
              {...(isLoginMode 
                ? loginForm.getInputProps('password')
                : registerForm.getInputProps('password')
              )}
            />

            <Button 
              type="submit" 
              fullWidth 
              mt="xl"
              disabled={loading}
            >
              {loading ? (
                <Loader size="sm" color="white" />
              ) : isLoginMode ? (
                'Войти'
              ) : (
                'Зарегистрироваться'
              )}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default Login;