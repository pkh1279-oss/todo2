'use strict';

// ===== State =====
let todos = [];
let filter = 'all';
let categoryFilter = '';
let sortBy = 'created';
let editingId = null;
let selectedPriority = 'low';
let editPriority = 'low';
let searchQuery = '';
let dragSrcId = null;

const STORAGE_KEY = 'todo2_todos';

const CAT_LABELS = {
  work: '업무', personal: '개인', shopping: '쇼핑', health: '건강', study: '학습'
};

const PRIORITY_LABELS = {
  low: '낮음', medium: '중간', high: '높음'
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// ===== Storage =====
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    todos = raw ? JSON.parse(raw) : [];
  } catch {
    todos = [];
  }
}

// ===== ID =====
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ===== Date helpers =====
function today() {
  return new Date().toISOString().slice(0, 10);
}

function dueDateStatus(date) {
  if (!date) return null;
  const t = today();
  if (date < t) return 'overdue';
  if (date === t) return 'today';
  return 'future';
}

function formatDate(date) {
  if (!date) return '';
  const [y, m, d] = date.split('-');
  return `${y}.${m}.${d}`;
}

// ===== Filter & Sort =====
function getVisible() {
  let list = todos.slice();

  // Filter by status
  if (filter === 'active') list = list.filter(t => !t.done);
  else if (filter === 'completed') list = list.filter(t => t.done);

  // Filter by category
  if (categoryFilter) list = list.filter(t => t.category === categoryFilter);

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(t => t.text.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q));
  }

  // Sort
  list.sort((a, b) => {
    if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (sortBy === 'due') {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    }
    if (sortBy === 'alpha') return a.text.localeCompare(b.text, 'ko');
    // created (default): newest first
    return b.createdAt - a.createdAt;
  });

  return list;
}

// ===== Render =====
function render() {
  const list = getVisible();
  const listEl = document.getElementById('todoList');
  const empty = document.getElementById('emptyState');

  // Remove existing todo items (not the empty state)
  const existing = listEl.querySelectorAll('.todo-item');
  existing.forEach(el => el.remove());

  updateStats();

  if (list.length === 0) {
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  list.forEach(todo => {
    const el = createTodoEl(todo);
    listEl.appendChild(el);
  });
}

function createTodoEl(todo) {
  const el = document.createElement('div');
  el.className = `todo-item${todo.done ? ' completed' : ''}`;
  el.dataset.id = todo.id;
  el.dataset.priority = todo.priority;
  el.draggable = true;

  const status = dueDateStatus(todo.due);
  const dueCls = status === 'overdue' ? 'due-date overdue' : status === 'today' ? 'due-date today' : 'due-date';

  const catLabel = todo.category ? CAT_LABELS[todo.category] : '';
  const catCls = todo.category ? `cat-${todo.category}` : '';

  el.innerHTML = `
    <button class="todo-check ${todo.done ? 'checked' : ''}" data-id="${todo.id}" aria-label="완료 토글">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </button>
    <div class="todo-content">
      <div class="todo-text">${escHtml(todo.text)}</div>
      <div class="todo-meta">
        ${todo.category ? `<span class="badge badge-cat ${catCls}">${catLabel}</span>` : ''}
        <span class="badge badge-priority-${todo.priority}">${PRIORITY_LABELS[todo.priority]}</span>
        ${todo.due ? `
          <span class="${dueCls}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            ${status === 'overdue' ? '기한 초과 · ' : status === 'today' ? '오늘까지 · ' : ''}${formatDate(todo.due)}
          </span>` : ''}
      </div>
      ${todo.note ? `<div class="todo-note">${escHtml(todo.note)}</div>` : ''}
    </div>
    <div class="todo-actions">
      <button class="btn-icon" data-action="edit" data-id="${todo.id}" title="수정">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="btn-icon danger" data-action="delete" data-id="${todo.id}" title="삭제">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
        </svg>
      </button>
    </div>
  `;

  // Drag events
  el.addEventListener('dragstart', onDragStart);
  el.addEventListener('dragover', onDragOver);
  el.addEventListener('drop', onDrop);
  el.addEventListener('dragend', onDragEnd);

  return el;
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ===== Stats =====
function updateStats() {
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  const active = total - done;
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  const circ = 2 * Math.PI * 15.9;
  const dash = (pct / 100) * circ;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statActive').textContent = active;
  document.getElementById('statDone').textContent = done;
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('progressRing').setAttribute('stroke-dasharray', `${dash.toFixed(1)} ${circ.toFixed(1)}`);
}

// ===== CRUD =====
function addTodo(text) {
  text = text.trim();
  if (!text) return;
  const dueVal = document.getElementById('dueDateInput').value;
  const cat = document.getElementById('categorySelect').value;
  todos.unshift({
    id: uid(),
    text,
    done: false,
    priority: selectedPriority,
    category: cat,
    due: dueVal || '',
    note: '',
    createdAt: Date.now()
  });
  save();
  render();
}

function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (t) { t.done = !t.done; save(); render(); }
}

function deleteTodo(id) {
  const el = document.querySelector(`.todo-item[data-id="${id}"]`);
  if (el) {
    el.classList.add('removing');
    el.addEventListener('animationend', () => {
      todos = todos.filter(t => t.id !== id);
      save();
      render();
    }, { once: true });
  }
}

function openEdit(id) {
  const t = todos.find(t => t.id === id);
  if (!t) return;
  editingId = id;
  editPriority = t.priority;

  document.getElementById('editInput').value = t.text;
  document.getElementById('editCategory').value = t.category || '';
  document.getElementById('editDueDate').value = t.due || '';
  document.getElementById('editNote').value = t.note || '';

  // Update edit priority buttons
  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.priority === editPriority);
  });

  document.getElementById('modalOverlay').classList.add('visible');
  setTimeout(() => document.getElementById('editInput').focus(), 100);
}

function saveEdit() {
  const t = todos.find(t => t.id === editingId);
  if (!t) return;
  const text = document.getElementById('editInput').value.trim();
  if (!text) return;
  t.text = text;
  t.priority = editPriority;
  t.category = document.getElementById('editCategory').value;
  t.due = document.getElementById('editDueDate').value;
  t.note = document.getElementById('editNote').value.trim();
  save();
  render();
  closeModal();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('visible');
  editingId = null;
}

// ===== Drag & Drop =====
function onDragStart(e) {
  dragSrcId = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.todo-item').forEach(el => el.classList.remove('drag-over'));
  this.classList.add('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const targetId = this.dataset.id;
  if (dragSrcId === targetId) return;

  const srcIdx = todos.findIndex(t => t.id === dragSrcId);
  const tgtIdx = todos.findIndex(t => t.id === targetId);
  if (srcIdx === -1 || tgtIdx === -1) return;

  const [item] = todos.splice(srcIdx, 1);
  todos.splice(tgtIdx, 0, item);
  save();
  render();
}

function onDragEnd() {
  document.querySelectorAll('.todo-item').forEach(el => {
    el.classList.remove('dragging', 'drag-over');
  });
}

// ===== Event Delegation =====
document.getElementById('todoList').addEventListener('click', e => {
  const check = e.target.closest('.todo-check');
  if (check) { toggleTodo(check.dataset.id); return; }

  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'edit') openEdit(btn.dataset.id);
  if (btn.dataset.action === 'delete') deleteTodo(btn.dataset.id);
});

// ===== Add =====
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');

addBtn.addEventListener('click', () => {
  addTodo(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    addTodo(todoInput.value);
    todoInput.value = '';
  }
});

// ===== Priority Buttons (add form) =====
document.querySelectorAll('.priority-btn:not([data-edit])').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.priority-btn:not([data-edit])').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPriority = btn.dataset.priority;
  });
});

// ===== Priority Buttons (edit modal) =====
document.querySelectorAll('[data-edit]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-edit]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    editPriority = btn.dataset.priority;
  });
});

// ===== Filters =====
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    render();
  });
});

document.getElementById('categoryFilter').addEventListener('change', e => {
  categoryFilter = e.target.value;
  render();
});

document.getElementById('sortSelect').addEventListener('change', e => {
  sortBy = e.target.value;
  render();
});

// ===== Search =====
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');

document.getElementById('searchToggle').addEventListener('click', () => {
  searchBar.classList.toggle('visible');
  if (searchBar.classList.contains('visible')) searchInput.focus();
  else { searchQuery = ''; searchInput.value = ''; render(); }
});

searchInput.addEventListener('input', e => {
  searchQuery = e.target.value;
  render();
});

document.getElementById('searchClear').addEventListener('click', () => {
  searchQuery = '';
  searchInput.value = '';
  searchInput.focus();
  render();
});

// ===== Bulk Actions =====
document.getElementById('clearCompleted').addEventListener('click', () => {
  todos = todos.filter(t => !t.done);
  save();
  render();
});

document.getElementById('completeAll').addEventListener('click', () => {
  const allDone = todos.every(t => t.done);
  todos.forEach(t => t.done = !allDone);
  save();
  render();
});

// ===== Theme =====
const root = document.documentElement;
document.getElementById('themeToggle').addEventListener('click', () => {
  const isDark = root.getAttribute('data-theme') === 'dark';
  root.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('todo2_theme', isDark ? 'light' : 'dark');
});

// ===== Modal =====
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('modalSave').addEventListener('click', saveEdit);

document.getElementById('editInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') saveEdit();
  if (e.key === 'Escape') closeModal();
});

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// ===== Init =====
(function init() {
  const savedTheme = localStorage.getItem('todo2_theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  load();
  render();
})();
