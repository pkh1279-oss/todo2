'use client';

import { Todo } from '@/lib/todos';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <button
        className="toggle-btn"
        onClick={() => onToggle(todo.id)}
        aria-label={todo.completed ? '완료 취소' : '완료로 표시'}
      >
        <span className="check-circle">{todo.completed ? '✓' : ''}</span>
      </button>
      <span className="todo-text">{todo.text}</span>
      <button
        className="delete-btn"
        onClick={() => onDelete(todo.id)}
        aria-label="삭제"
      >
        ×
      </button>
    </li>
  );
}
