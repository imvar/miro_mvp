import { useState, useRef, useEffect, useCallback } from 'react';
import { Paper, Group, Textarea, ActionIcon } from '@mantine/core';
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

const STICKER_COLORS = [
  '#ffeb3b', // Желтый
  '#ff9800', // Оранжевый
  '#f44336', // Красный
  '#e91e63', // Розовый
  '#9c27b0', // Фиолетовый
  '#3f51b5', // Синий
  '#2196f3', // Голубой
  '#00bcd4', // Циан
  '#009688', // Бирюзовый
  '#4caf50', // Зеленый
  '#8bc34a', // Светло-зеленый
  '#cddc39', // Лайм
];

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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0
  });
  const stickerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLTextAreaElement) {
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const boardRect = stickerRef.current?.parentElement?.getBoundingClientRect();
      if (!boardRect) return;

      const newX = e.clientX - boardRect.left - offset.x;
      const newY = e.clientY - boardRect.top - offset.y;

      onPositionChange(sticker.id, newX, newY);
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      // Минимальные размеры
      const minWidth = 100;
      const minHeight = 80;

      // Вычисляем новые размеры с учетом минимальных значений
      const newWidth = Math.max(minWidth, resizeStart.width + deltaX);
      const newHeight = Math.max(minHeight, resizeStart.height + deltaY);

      onResize(sticker.id, newWidth, newHeight);
    }
  }, [isDragging, isResizing, offset, resizeStart, sticker.id, onPositionChange, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Добавляем глобальные обработчики для перетаскивания и ресайза
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
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

  return (
    <Paper
      ref={stickerRef}
      style={{
        position: 'absolute',
        cursor: isDragging ? 'grabbing' : 'grab',
        padding: '8px',
        borderRadius: '8px',
        boxShadow: isSelected
          ? '0 0 0 2px #228be6'
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
      <Group justify="flex-end" mb={4} style={{ minHeight: '24px', gap: '4px' }}>
        <ActionIcon
          size="sm"
          variant="subtle"
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
        >
          <IconPalette size={14} />
        </ActionIcon>
        <ActionIcon
          size="sm"
          color="red"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(sticker.id);
          }}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>

      {/* Палитра цветов */}
      {showColorPicker && (
        <div
          style={{
            position: 'absolute',
            top: '30px',
            right: '8px',
            backgroundColor: 'white',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {STICKER_COLORS.map((color) => (
            <div
              key={color}
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: color,
                borderRadius: '4px',
                cursor: 'pointer',
                border: sticker.data.color === color ? '2px solid #228be6' : '1px solid #ddd',
                transition: 'transform 0.1s',
              }}
              onClick={() => {
                onUpdateColor(sticker.id, color);
                setShowColorPicker(false);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          ))}
        </div>
      )}

      <Textarea
        value={sticker.content}
        onChange={(e) => onUpdateContent(sticker.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        variant="unstyled"
        autosize
        minRows={2}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          fontSize: '14px',
          lineHeight: '1.4',
          width: '100%',
          resize: 'none',
          cursor: 'text',
          height: 'calc(100% - 30px)' // Оставляем место для кнопки удаления
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
            backgroundColor: '#228be6',
            borderRadius: '2px',
            cursor: 'nwse-resize',
            border: '2px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}
          onMouseDown={handleResizeStart}
        />
      )}
    </Paper>
  );
}
