import { createBrowserRouter, Navigate } from 'react-router';
import { PublicRoute } from '../components/PublicRoute';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Login from '../pages/Login/Login';
import Layout from '../components/Layout';
import { BoardsList } from '../pages/BoardList/BoardList';
import { api } from '../api/axiosConfig';
import { Board } from '../pages/Board/Board';
import NotFoundPage from '../pages/NotFound/NotFound';

interface LoaderData {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  boards?: Array<{
    id: string;
    title: string;
    updatedAt: string;
  }>;
  board?: {
    id: string;
    title: string;
    elements: any[];
    isNew?: boolean;
  };
}

const loadUserData = async (): Promise<LoaderData> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { user: undefined };
    }

    const response = await api.get('/api/user/profile');

    if (response.status !== 200) {
      localStorage.removeItem('token'); // Очищаем невалидный токен
      return { user: undefined };
    }

    return { user: response.data };
  } catch (error) {
    console.error('Ошибка загрузки данных пользователя:', error);
    return { user: undefined };
  }
};

const loadBoards = async (): Promise<LoaderData> => {
  const token = localStorage.getItem('token');

  const response = await api.get('/api/boards', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status !== 200) {
    throw new Response('Ошибка загрузки досок', { status: response.status });
  }

  console.log('Boards response:', response.data); // Для отладки

  // Сервер возвращает массив досок напрямую, а не в обертке boards
  return { boards: response.data };
};

// const loadBoard = async ({ params }: { params: any }): Promise<LoaderData> => {
//   const { boardId } = params;

//   if (boardId === 'new') {
//     return {
//       board: {
//         id: 'new',
//         title: 'Новая доска',
//         elements: [],
//         isNew: true
//       }
//     };
//   }

//   const response = await api.get(`/api/boards/${boardId}`);
//   if (!response.ok) {
//     throw new Response('Доска не найдена', { status: 404 });
//   }
//   return response.json();
// };

const saveBoardAction = async ({ request, params }: { request: Request; params: any }) => {
  const formData = await request.formData();
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const elements = JSON.parse(formData.get('elements') as string);

  const response = await fetch(`/api/boards/${params.boardId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, description, elements }),
  });

  if (!response.ok) {
    throw new Error('Failed to save board');
  }

  return { success: true };
}

// Создание роутера
export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    loader: loadUserData,
    errorElement: <Navigate to="/login" replace />,
    children: [
      {
        index: true,
        element: <Navigate to="/boards" replace />
      },
      {
        path: 'boards',
        element: <BoardsList />,
        loader: loadBoards,
        errorElement: <div>Ошибка загрузки досок</div>
      },
      {
        path: 'board/:boardId',
        element: <Board />,
        // loader: loadBoard,
        action: saveBoardAction,
        errorElement: <div>Ошибка загрузки доски</div>
      },
      // {
      //   path: 'logout',
      //   action: logoutAction
      // }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);
