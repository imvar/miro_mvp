const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const jwt = require('jsonwebtoken');

// Используем middleware
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Секретный ключ для JWT (в продакшене должен быть в .env)
const JWT_SECRET = 'your-secret-key-here';

// Middleware для проверки токена (кроме auth-роутов)
server.use((req, res, next) => {
  if (req.path.startsWith('/api/auth') || req.path === '/') {
    return next();
  }
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Не авторизован' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Неверный токен' });
  }
});

// Кастомные маршруты

// Авторизация
server.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = router.db;

  console.log(username);
  console.log(password);
  
  
  const user = db.get('users').find({ username }).value();
  
  // В реальном приложении здесь должна быть проверка хэша пароля
  // Для демо просто проверяем существование пользователя
  if (!user || password !== 'admin123') {
    return res.status(401).json({ message: 'Неверные учетные данные' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username
    }
  });
});

// Регистрация
server.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  const db = router.db;
  
  // Проверка существующего пользователя
  const existingUser = db.get('users').find({ username }).value();
  if (existingUser) {
    return res.status(400).json({ message: 'Пользователь уже существует' });
  }
  
  // Создаем нового пользователя
  const newUser = {
    id: Date.now(),
    username,
    password_hash: password // В реальном приложении нужно хэшировать
  };
  
  db.get('users').push(newUser).write();
  
  const token = jwt.sign(
    { id: newUser.id, username: newUser.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username
    }
  });
});

// Профиль пользователя
server.get('/api/user/profile', (req, res) => {
  const db = router.db;
  const user = db.get('users').find({ id: req.user.id }).value();
  
  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    name: user.username // для совместимости с фронтендом
  });
});

// Получение досок пользователя
server.get('/api/boards', (req, res) => {
  const db = router.db;
  const userId = req.user.id;
  console.log(req.user);
  
  
  // Получаем ID досок пользователя
  const userBoardIds = db.get('board_users')
    .filter({ user_id: userId })
    .map('board_id')
    .value();
  
  // Получаем сами доски
  const boards = db.get('boards')
    .filter(board => userBoardIds.includes(board.id))
    .value()
    .map(board => ({
      ...board,
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      membersCount: db.get('board_users').filter({ board_id: board.id }).size().value(),
      description: board.description || `Описание доски "${board.title}"`
    }));
  
  res.json({ boards });
});

// Получение конкретной доски со стикерами
server.get('/api/boards/:id', (req, res) => {
  const db = router.db;
  const boardId = parseInt(req.params.id);
  const userId = req.user.id;
  
  // Проверяем доступ пользователя к доске
  const hasAccess = db.get('board_users')
    .find({ board_id: boardId, user_id: userId })
    .value();
  
  if (!hasAccess && boardId !== 'new') {
    return res.status(403).json({ message: 'Нет доступа к доске' });
  }
  
  const board = db.get('boards').find({ id: boardId }).value();
  
  if (!board && boardId !== 'new') {
    return res.status(404).json({ message: 'Доска не найдена' });
  }
  
  const stickers = db.get('stickers')
    .filter({ board_id: boardId })
    .value();
  
  res.json({
    board: {
      ...board,
      elements: stickers.map(sticker => ({
        id: sticker.id,
        type: 'sticker',
        content: sticker.content,
        style: {
          backgroundColor: sticker.color,
          left: `${sticker.x}px`,
          top: `${sticker.y}px`,
          width: `${sticker.width}px`,
          height: `${sticker.height}px`,
          zIndex: sticker.z_index
        },
        data: {
          color: sticker.color,
          x: sticker.x,
          y: sticker.y,
          width: sticker.width,
          height: sticker.height,
          zIndex: sticker.z_index
        }
      }))
    }
  });
});

// Создание/обновление доски
server.post('/api/boards/:id', (req, res) => {
  const db = router.db;
  const boardId = req.params.id;
  const { title, description, elements } = req.body;

  console.log('=== SAVE BOARD REQUEST ===');
  console.log('Board ID:', boardId);
  console.log('Title:', title);
  console.log('Description:', description);
  console.log('Elements to save:', elements ? elements.length : 0, 'items');
  
  let board;
  const boardIdNum = boardId === 'new' ? Date.now() : parseInt(boardId);
  
  // Покажем текущую доску
  const existingBoard = db.get('boards').find({ id: boardIdNum }).value();
  console.log('Existing board:', existingBoard);
  
  if (boardId === 'new') {
    // Создание новой доски
    board = {
      id: boardIdNum,
      title: title || 'Новая доска',
      description: description || 'Описание',
    };
    
    console.log('Creating new board:', board);
    db.get('boards').push(board).write();
    
    // Добавляем пользователя как владельца
    db.get('board_users').push({
      board_id: board.id,
      user_id: req.user.id
    }).write();
  } else {
    // Обновление существующей доски
    board = existingBoard;
    if (board) {
      board.title = title || board.title;
      board.description = description || board.description;
      console.log('Updating board:', board);
      db.get('boards').find({ id: boardIdNum }).assign(board).write();
    } else {
      console.log('Board not found:', boardIdNum);
      return res.status(404).json({ message: 'Доска не найдена' });
    }
  }
  
  // Сохраняем стикеры
  if (elements && Array.isArray(elements)) {
    console.log('Removing old stickers for board_id:', boardIdNum);
    
    // Покажем какие стикеры сейчас есть
    const oldStickers = db.get('stickers').filter({ board_id: boardIdNum }).value();
    console.log('Old stickers to remove:', oldStickers.length);
    
    // Удаляем старые стикеры
    db.get('stickers').remove({ board_id: boardIdNum }).write();
    
    // Проверяем, удалились ли
    const afterRemoval = db.get('stickers').filter({ board_id: boardIdNum }).value();
    console.log('Stickers after removal:', afterRemoval.length);
    
    // Добавляем новые
    console.log('Adding new stickers:', elements.length);
    elements.forEach((element, index) => {
      if (element.type === 'sticker') {
        // Генерируем числовой ID для стикера
        const stickerId = typeof element.id === 'string' && element.id.startsWith('sticker-') 
          ? parseInt(element.id.replace('sticker-', '')) 
          : (element.id || Date.now() + index);
          
        const sticker = {
          id: stickerId,
          board_id: boardIdNum,
          content: element.content || '',
          color: element.data?.color || '#ffeb3b',
          x: element.data?.x || 0,
          y: element.data?.y || 0,
          width: element.data?.width || 150,
          height: element.data?.height || 150,
          z_index: element.data?.zIndex || index
        };
        
        console.log(`Sticker ${index + 1}:`, sticker);
        db.get('stickers').push(sticker).write();
      }
    });
    
    // Проверяем результат
    const finalStickers = db.get('stickers').filter({ board_id: boardIdNum }).value();
    console.log('Final stickers count:', finalStickers.length);
  }
  
  res.json({ success: true, board });
});

// Удаление доски
server.delete('/api/boards/:id', (req, res) => {
  const db = router.db;
  const boardId = parseInt(req.params.id);
  
  // Проверяем доступ
  const hasAccess = db.get('board_users')
    .find({ board_id: boardId, user_id: req.user.id })
    .value();
  
  if (!hasAccess) {
    return res.status(403).json({ message: 'Нет доступа' });
  }
  
  // Удаляем доску (стикеры удалятся каскадно)
  db.get('boards').remove({ id: boardId }).write();
  
  // Удаляем связи пользователей
  db.get('board_users').remove({ board_id: boardId }).write();
  
  res.json({ success: true });
});

// Логаут (на клиенте просто удаляет токен)
server.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Используем стандартный роутер для остальных запросов
server.use('/api', router);

// Запускаем сервер
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`JSON Server запущен на порту ${PORT}`);
  console.log(`API доступен по адресу: http://localhost:${PORT}`);
  console.log('Доступные маршруты:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register');
  console.log('  GET  /api/user/profile');
  console.log('  GET  /api/boards');
  console.log('  GET  /api/boards/:id');
  console.log('  POST /api/boards/:id');
  console.log('  DELETE /api/boards/:id');
});