import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Paper, Group, Textarea, ActionIcon, Popover, ColorPicker } from '@mantine/core';
import { IconTrash, IconPalette } from '@tabler/icons-react';

interface StickerProps {
  sticker: {
    id: string;
    type: 'sticker';
    content: string;
    style: {
      backgroundColor: string;
      left: string;
      top: string;
      width: string;
      height: string;
      zIndex: number;
    };
    data: {
      color: string;
      x: number;
      y: number;
      width: number;
      height: number;
      zIndex: number;
    };
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdateContent: (id: string, content: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
}

// Функция для вычисления яркости цвета (по формуле W3C)
const getBrightness = (hexColor: string): number => {
  // Убираем # если есть
  const hex = hexColor.replace('#', '');
  
  // Преобразуем 3-значный HEX в 6-значный
  const fullHex = hex.length === 3 
    ? hex.split('').map(char => char + char).join('')
    : hex;
  
  // Разбираем на RGB компоненты
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  // Формула яркости W3C
  return (r * 299 + g * 587 + b * 114) / 1000;
};

// Функция для определения контрастного цвета текста
const getContrastTextColor = (backgroundColor: string): string => {
  const brightness = getBrightness(backgroundColor);
  
  // Пороговое значение для определения темный/светлый фон
  // 128 - средняя яркость (0-255 шкала, но наша формула дает 0-255)
  return brightness > 128 ? '#000000' : '#ffffff';
};

// Функция для определения цвета для кнопок (немного другой алгоритм для лучшей видимости)
const getButtonTextColor = (backgroundColor: string): string => {
  const brightness = getBrightness(backgroundColor);
  
  // Для кнопок используем более контрастные цвета
  if (brightness > 192) {
    return '#000000'; // Очень светлый фон - черный текст
  } else if (brightness > 96) {
    return '#333333'; // Средний фон - темно-серый
  } else {
    return '#ffffff'; // Темный фон - белый текст
  }
};

export function Sticker({ 
  sticker, 
  isSelected, 
  onSelect, 
  onUpdateContent, 
  onUpdateColor,
  onDelete,
  onPositionChange,
  onResize 
}: StickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ 
    width: 0, 
    height: 0, 
    x: 0, 
    y: 0 
  });
  const stickerRef = useRef<HTMLDivElement>(null);

  // Вычисляем контрастные цвета на основе фона стикера
  const textColor = useMemo(() => 
    getContrastTextColor(sticker.data.color), 
    [sticker.data.color]
  );
  
  const buttonTextColor = useMemo(() => 
    getButtonTextColor(sticker.data.color), 
    [sticker.data.color]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    // Не начинаем перетаскивание если кликнули на текстовое поле, кнопку или ColorPicker
    const target = e.target as HTMLElement;
    const isTextarea = target instanceof HTMLTextAreaElement;
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isColorPicker = target.closest('.mantine-ColorPicker-root') || 
                         target.closest('.mantine-Popover-dropdown');
    
    if (isTextarea || isButton || isColorPicker) {
      return;
    }
    
    setIsDragging(true);
    onSelect(sticker.id);
    
    const rect = stickerRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    
    e.preventDefault();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    onSelect(sticker.id);
    
    setResizeStart({
      width: sticker.data.width,
      height: sticker.data.height,
      x: e.clientX,
      y: e.clientY
    });
    
    e.preventDefault();
  };

  // Извлекаем нужные свойства из sticker.data для зависимостей
  const { width, height, x, y } = sticker.data;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const boardRect = stickerRef.current?.parentElement?.getBoundingClientRect();
      if (!boardRect) return;
      
      // Рассчитываем новые координаты
      let newX = e.clientX - boardRect.left - offset.x;
      let newY = e.clientY - boardRect.top - offset.y;
      
      // Минимальные координаты (нельзя выйти за левый/верхний край)
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      
      // Максимальные координаты (нельзя выйти за правый/нижний край)
      const maxX = boardRect.width - width;
      const maxY = boardRect.height - height;
      newX = Math.min(maxX, newX);
      newY = Math.min(maxY, newY);
      
      onPositionChange(sticker.id, newX, newY);
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      // Минимальные размеры
      const minWidth = 100;
      const minHeight = 80;
      
      // Максимальные размеры (ограничиваем размером доски)
      const boardRect = stickerRef.current?.parentElement?.getBoundingClientRect();
      const maxWidth = boardRect ? boardRect.width - x : 500;
      const maxHeight = boardRect ? boardRect.height - y : 500;
      
      // Вычисляем новые размеры с учетом ограничений
      const newWidth = Math.min(
        Math.max(minWidth, resizeStart.width + deltaX),
        maxWidth
      );
      const newHeight = Math.min(
        Math.max(minHeight, resizeStart.height + deltaY),
        maxHeight
      );
      
      onResize(sticker.id, newWidth, newHeight);
    }
  }, [
    isDragging, 
    isResizing, 
    offset, 
    resizeStart, 
    sticker.id, 
    onPositionChange, 
    onResize,
    width,
    height,
    x,
    y
  ]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Добавляем глобальные обработчики для перетаскивания и ресайза
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging || isResizing) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) {
        handleMouseUp();
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Обновляем курсор при ресайзе
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'nwse-resize';
    } else {
      document.body.style.cursor = '';
    }
    
    return () => {
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  // Обработчик изменения цвета
  const handleColorChange = (color: string) => {
    onUpdateColor(sticker.id, color);
  };

  return (
    <Paper
      ref={stickerRef}
      style={{
        position: 'absolute',
        cursor: isDragging ? 'grabbing' : 'grab',
        padding: '8px',
        borderRadius: '8px',
        boxShadow: isSelected 
          ? `0 0 0 2px ${textColor === '#ffffff' ? '#228be6' : '#000000'}`
          : '0 1px 3px rgba(0,0,0,0.12)',
        userSelect: 'none',
        touchAction: 'none',
        ...sticker.style,
        left: `${sticker.data.x}px`,
        top: `${sticker.data.y}px`,
        backgroundColor: sticker.data.color,
        width: `${sticker.data.width}px`,
        height: `${sticker.data.height}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <Group mb={4} style={{ minHeight: '24px' }}>
        {isSelected && (
          <Popover
            position="bottom"
            withArrow
            shadow="md"
            withinPortal
            closeOnClickOutside
            onClose={() => {
              // Убедимся что не перетаскиваем когда закрываем ColorPicker
              if (isDragging) setIsDragging(false);
            }}
          >
            <Popover.Target>
              <ActionIcon
                size="sm"
                color={textColor === '#ffffff' ? 'blue' : 'dark'}
                variant="filled"
                style={{
                  color: buttonTextColor,
                  backgroundColor: textColor === '#ffffff' 
                    ? 'rgba(255, 255, 255, 0.3)' 
                    : 'rgba(0, 0, 0, 0.1)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(sticker.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <IconPalette size={14} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ pointerEvents: 'auto' }}
            >
              <ColorPicker
                format="hex"
                value={sticker.data.color}
                onChange={handleColorChange}
                swatches={[
                  '#ffeb3b', // Желтый (стандартный)
                  '#ff9800', // Оранжевый
                  '#f44336', // Красный
                  '#e91e63', // Розовый
                  '#9c27b0', // Фиолетовый
                  '#673ab7', // Темно-фиолетовый
                  '#3f51b5', // Синий
                  '#2196f3', // Голубой
                  '#03a9f4', // Светло-голубой
                  '#00bcd4', // Бирюзовый
                  '#009688', // Зеленый-бирюзовый
                  '#4caf50', // Зеленый
                  '#8bc34a', // Светло-зеленый
                  '#cddc39', // Лаймовый
                  '#ffc107', // Янтарный
                  '#795548', // Коричневый
                  '#9e9e9e', // Серый
                  '#607d8b', // Сине-серый
                  '#ffffff', // Белый
                  '#000000', // Черный
                ]}
                size="md"
              />
            </Popover.Dropdown>
          </Popover>
        )}
        <ActionIcon
          size="sm"
          color={textColor === '#ffffff' ? 'red' : 'dark'}
          variant="filled"
          style={{
            color: buttonTextColor,
            backgroundColor: textColor === '#ffffff' 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(0, 0, 0, 0.1)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(sticker.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
      
      <Textarea
        value={sticker.content}
        onChange={(e) => onUpdateContent(sticker.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect(sticker.id);
        }}
        variant="unstyled"
        autosize
        minRows={2}
        maxRows={10}
        styles={{
          input: {
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '14px',
            lineHeight: '1.4',
            width: '100%',
            resize: 'none',
            cursor: 'text',
            height: 'calc(100% - 30px)',
            pointerEvents: 'auto',
            color: textColor,
            '&::placeholder': {
              color: `${textColor}80`, // Полупрозрачный цвет для placeholder
            },
            '&:focus': {
              outline: 'none',
              boxShadow: 'none',
            },
          },
        }}
      />
      
      {/* Маркер для изменения размера */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '16px',
            height: '16px',
            backgroundColor: textColor === '#ffffff' ? '#228be6' : '#000000',
            borderRadius: '2px',
            cursor: 'nwse-resize',
            border: `2px solid ${textColor === '#ffffff' ? 'white' : '#333'}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}
          onMouseDown={handleResizeStart}
        />
      )}
    </Paper>
  );
}