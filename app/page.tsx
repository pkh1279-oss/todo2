'use client';

import { useState, useEffect } from 'react';
import { Todo } from '@/lib/todos';
import { AddTodoForm } from '@/components/AddTodoForm';
import { FilterTabs } from '@/components/FilterTabs';
import { TodoList } from '@/components/TodoList';

type Filter = 'all' | 'active' | 'completed';

const STORAGE_KEY = 'todos';

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    setTodos(loadTodos());
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  function addTodo(text: string) {
    setTodos((prev) => [
      {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <main className="container">
      <h1 className="title">✅ 할 일 목록</h1>
      <div className="card">
        <AddTodoForm onAdd={addTodo} />
        <FilterTabs
          currentFilter={filter}
          activeCount={activeCount}
          completedCount={completedCount}
          onFilterChange={setFilter}
        />
        <TodoList todos={filtered} onToggle={toggleTodo} onDelete={deleteTodo} />
        <div className="footer">
          <span className="count">{activeCount}개 남음</span>
          {completedCount > 0 && (
            <button type="button" className="clear-btn" onClick={clearCompleted}>
              완료 항목 삭제 ({completedCount})
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
