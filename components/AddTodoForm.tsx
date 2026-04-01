'use client';

import { useRef } from 'react';

export function AddTodoForm({ onAdd }: { onAdd: (text: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputRef.current?.value.trim();
    if (!text) return;
    onAdd(text);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <form onSubmit={handleSubmit} className="add-form">
      <input
        ref={inputRef}
        type="text"
        placeholder="새로운 할 일을 입력하세요..."
        className="add-input"
        autoFocus
      />
      <button type="submit" className="add-btn">추가</button>
    </form>
  );
}
