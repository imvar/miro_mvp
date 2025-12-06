// src/App.tsx
import { RouterProvider } from 'react-router';
import { Suspense } from 'react';
import { router } from './router/router';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css'; // Важно: импорт стилей

function App() {
  return (
    <MantineProvider
      theme={{
        // Настройки темы
        primaryColor: 'indigo',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Suspense 
        fallback={
          <div className="loading-screen">
            <div className="spinner">🎨</div>
            <p>Загрузка MiroClone...</p>
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </MantineProvider>
  );
}

export default App;