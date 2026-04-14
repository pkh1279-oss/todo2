'use strict';

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const INDEX_HTML = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const APP_JS = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

// ── 헬퍼 ────────────────────────────────────────────────────────────────

/**
 * 새 jsdom 인스턴스에 app.js를 로드해 반환.
 * initialTodos를 넘기면 앱 초기화 전에 localStorage에 주입.
 */
function boot(initialTodos = []) {
  const dom = new JSDOM(INDEX_HTML, { runScripts: 'dangerously', url: 'http://localhost' });
  const { window } = dom;

  if (initialTodos.length) {
    window.localStorage.setItem('todo2_todos', JSON.stringify(initialTodos));
  }

  const script = window.document.createElement('script');
  script.textContent = APP_JS;
  window.document.body.appendChild(script);

  return window;
}

/** localStorage에서 현재 todos 배열 읽기 */
function storedTodos(win) {
  const raw = win.localStorage.getItem('todo2_todos');
  return raw ? JSON.parse(raw) : [];
}

/** DOM을 통해 할일 추가 */
function addTodoDom(win, text, { priority = 'low', category = '', due = '' } = {}) {
  const doc = win.document;
  doc.getElementById('todoInput').value = text;
  if (priority !== 'low') {
    doc.querySelector(`.priority-btn:not([data-edit])[data-priority="${priority}"]`)?.click();
  }
  if (category) doc.getElementById('categorySelect').value = category;
  if (due) doc.getElementById('dueDateInput').value = due;
  doc.getElementById('addBtn').click();
}

/** 테스트용 todo 객체 생성 */
let _seq = 0;
function todo(overrides = {}) {
  _seq++;
  return {
    id: `t${_seq}`,
    text: '기본 할일',
    done: false,
    priority: 'low',
    category: '',
    due: '',
    note: '',
    createdAt: _seq,
    ...overrides,
  };
}

/** 렌더된 todo 텍스트 목록 */
function renderedTexts(win) {
  return [...win.document.querySelectorAll('.todo-text')].map(el => el.textContent);
}

/** dataTransfer가 붙은 커스텀 드래그 이벤트 생성 */
function dragEvent(type, win) {
  const ev = new win.Event(type, { bubbles: true, cancelable: true });
  ev.dataTransfer = { effectAllowed: '', dropEffect: '' };
  return ev;
}

// ── 순수 함수 ────────────────────────────────────────────────────────────

describe('escHtml()', () => {
  let fn;
  beforeAll(() => { fn = boot().escHtml; });

  test.each([
    ['a & b',   'a &amp; b'],
    ['<script>', '&lt;script&gt;'],
    ['"hello"',  '&quot;hello&quot;'],
    ["it's",     "it&#39;s"],
  ])('"%s" → "%s"', (input, expected) => {
    expect(fn(input)).toBe(expected);
  });

  test('특수문자 없으면 그대로 반환', () => {
    expect(fn('일반 텍스트 123')).toBe('일반 텍스트 123');
  });
});

describe('dueDateStatus()', () => {
  let fn;
  beforeAll(() => { fn = boot().dueDateStatus; });

  test('날짜 없으면 null', () => {
    expect(fn('')).toBeNull();
    expect(fn(null)).toBeNull();
    expect(fn(undefined)).toBeNull();
  });

  test('과거 날짜 → "overdue"', () => {
    expect(fn('2000-01-01')).toBe('overdue');
  });

  test('미래 날짜 → "future"', () => {
    expect(fn('2100-12-31')).toBe('future');
  });

  test('오늘 날짜 → "today"', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(fn(today)).toBe('today');
  });
});

describe('formatDate()', () => {
  let fn;
  beforeAll(() => { fn = boot().formatDate; });

  test('ISO 날짜를 y.m.d 형식으로 변환', () => {
    expect(fn('2025-04-03')).toBe('2025.04.03');
    expect(fn('2000-01-01')).toBe('2000.01.01');
  });

  test('빈 값이면 빈 문자열 반환', () => {
    expect(fn('')).toBe('');
    expect(fn(null)).toBe('');
  });
});

// ── 할일 추가 ─────────────────────────────────────────────────────────────

describe('할일 추가', () => {
  let win;
  beforeEach(() => { win = boot(); });

  test('목록에 렌더된다', () => {
    addTodoDom(win, '새 할일');
    expect(win.document.querySelectorAll('.todo-item').length).toBe(1);
    expect(win.document.querySelector('.todo-text').textContent).toBe('새 할일');
  });

  test('localStorage에 저장된다', () => {
    addTodoDom(win, '저장 확인');
    const todos = storedTodos(win);
    expect(todos).toHaveLength(1);
    expect(todos[0].text).toBe('저장 확인');
    expect(todos[0].done).toBe(false);
  });

  test('공백만 입력하면 추가되지 않는다', () => {
    addTodoDom(win, '   ');
    expect(win.document.querySelectorAll('.todo-item').length).toBe(0);
  });

  test('우선순위가 저장된다', () => {
    addTodoDom(win, '우선순위 테스트', { priority: 'high' });
    expect(storedTodos(win)[0].priority).toBe('high');
  });

  test('카테고리가 저장된다', () => {
    addTodoDom(win, '카테고리 테스트', { category: 'work' });
    expect(storedTodos(win)[0].category).toBe('work');
  });

  test('마감일이 저장된다', () => {
    addTodoDom(win, '마감일 테스트', { due: '2025-12-31' });
    expect(storedTodos(win)[0].due).toBe('2025-12-31');
  });

  test('통계(전체/진행 중)가 업데이트된다', () => {
    addTodoDom(win, '통계 확인');
    expect(win.document.getElementById('statTotal').textContent).toBe('1');
    expect(win.document.getElementById('statActive').textContent).toBe('1');
    expect(win.document.getElementById('statDone').textContent).toBe('0');
  });

  test('Enter 키로 추가된다', () => {
    const input = win.document.getElementById('todoInput');
    input.value = 'Enter 키 테스트';
    const ev = new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    input.dispatchEvent(ev);
    expect(win.document.querySelectorAll('.todo-item').length).toBe(1);
  });
});

// ── 완료 토글 ─────────────────────────────────────────────────────────────

describe('완료 토글', () => {
  let win;
  beforeEach(() => {
    win = boot([todo({ id: 'tgl1', text: '토글 테스트' })]);
  });

  test('완료 처리', () => {
    win.document.querySelector('.todo-check').click();
    expect(storedTodos(win)[0].done).toBe(true);
    expect(win.document.querySelector('.todo-item').classList.contains('completed')).toBe(true);
  });

  test('완료 → 미완료 토글', () => {
    win.document.querySelector('.todo-check').click();
    win.document.querySelector('.todo-check').click();
    expect(storedTodos(win)[0].done).toBe(false);
    expect(win.document.querySelector('.todo-item').classList.contains('completed')).toBe(false);
  });

  test('완료 통계가 업데이트된다', () => {
    win.document.querySelector('.todo-check').click();
    expect(win.document.getElementById('statDone').textContent).toBe('1');
    expect(win.document.getElementById('statActive').textContent).toBe('0');
  });
});

// ── 삭제 ──────────────────────────────────────────────────────────────────

describe('할일 삭제', () => {
  let win;
  beforeEach(() => {
    win = boot([todo({ id: 'del1', text: '삭제 테스트' })]);
  });

  test('삭제 버튼 클릭 시 removing 클래스 추가', () => {
    win.document.querySelector('[data-action="delete"]').click();
    expect(win.document.querySelector('.todo-item').classList.contains('removing')).toBe(true);
  });

  test('animationend 후 DOM·localStorage에서 제거', () => {
    win.document.querySelector('[data-action="delete"]').click();
    win.document.querySelector('.todo-item').dispatchEvent(new win.Event('animationend'));

    expect(win.document.querySelectorAll('.todo-item').length).toBe(0);
    expect(storedTodos(win)).toHaveLength(0);
  });
});

// ── 수정 모달 ─────────────────────────────────────────────────────────────

describe('할일 수정', () => {
  const base = todo({ id: 'edt1', text: '원본', priority: 'low', category: '', due: '', note: '' });
  let win;
  beforeEach(() => { win = boot([base]); });

  test('수정 버튼 클릭 시 모달이 열린다', () => {
    win.document.querySelector('[data-action="edit"]').click();
    expect(win.document.getElementById('modalOverlay').classList.contains('visible')).toBe(true);
    expect(win.document.getElementById('editInput').value).toBe('원본');
  });

  test('저장 버튼 클릭 시 텍스트가 수정된다', () => {
    win.document.querySelector('[data-action="edit"]').click();
    win.document.getElementById('editInput').value = '수정 완료';
    win.document.getElementById('modalSave').click();

    expect(storedTodos(win)[0].text).toBe('수정 완료');
    expect(win.document.getElementById('modalOverlay').classList.contains('visible')).toBe(false);
  });

  test('취소 클릭 시 변경 없이 닫힌다', () => {
    win.document.querySelector('[data-action="edit"]').click();
    win.document.getElementById('editInput').value = '저장 안 됨';
    win.document.getElementById('modalCancel').click();

    expect(storedTodos(win)[0].text).toBe('원본');
    expect(win.document.getElementById('modalOverlay').classList.contains('visible')).toBe(false);
  });

  test('모달 바깥 클릭 시 닫힌다', () => {
    win.document.querySelector('[data-action="edit"]').click();
    win.document.getElementById('modalOverlay').click();
    expect(win.document.getElementById('modalOverlay').classList.contains('visible')).toBe(false);
  });

  test('Escape 키로 닫힌다', () => {
    win.document.querySelector('[data-action="edit"]').click();
    const ev = new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    win.document.getElementById('editInput').dispatchEvent(ev);
    expect(win.document.getElementById('modalOverlay').classList.contains('visible')).toBe(false);
  });
});

// ── 상태 필터 ─────────────────────────────────────────────────────────────

describe('상태 필터', () => {
  const TODOS = [
    todo({ id: 'sf1', text: '진행1', done: false, createdAt: 3 }),
    todo({ id: 'sf2', text: '완료1', done: true,  createdAt: 2 }),
    todo({ id: 'sf3', text: '진행2', done: false, createdAt: 1 }),
  ];
  let win;
  beforeEach(() => { win = boot(TODOS); });

  test('기본: 전체 표시', () => {
    expect(win.document.querySelectorAll('.todo-item').length).toBe(3);
  });

  test('"진행 중" 필터: 미완료만 표시', () => {
    win.document.querySelector('[data-filter="active"]').click();
    expect(win.document.querySelectorAll('.todo-item').length).toBe(2);
  });

  test('"완료" 필터: 완료만 표시', () => {
    win.document.querySelector('[data-filter="completed"]').click();
    const items = win.document.querySelectorAll('.todo-item');
    expect(items.length).toBe(1);
    expect(items[0].querySelector('.todo-text').textContent).toBe('완료1');
  });
});

// ── 카테고리 필터 ──────────────────────────────────────────────────────────

describe('카테고리 필터', () => {
  const TODOS = [
    todo({ id: 'cf1', text: '업무', category: 'work',     createdAt: 2 }),
    todo({ id: 'cf2', text: '개인', category: 'personal', createdAt: 1 }),
  ];
  let win;
  beforeEach(() => { win = boot(TODOS); });

  test('카테고리로 필터링', () => {
    const sel = win.document.getElementById('categoryFilter');
    sel.value = 'work';
    sel.dispatchEvent(new win.Event('change'));

    expect(win.document.querySelectorAll('.todo-item').length).toBe(1);
    expect(win.document.querySelector('.todo-text').textContent).toBe('업무');
  });

  test('카테고리 초기화 시 전체 표시', () => {
    const sel = win.document.getElementById('categoryFilter');
    sel.value = 'work';
    sel.dispatchEvent(new win.Event('change'));
    sel.value = '';
    sel.dispatchEvent(new win.Event('change'));

    expect(win.document.querySelectorAll('.todo-item').length).toBe(2);
  });
});

// ── 검색 ──────────────────────────────────────────────────────────────────

describe('검색', () => {
  const TODOS = [
    todo({ id: 'se1', text: '리액트 공부', note: '',       createdAt: 3 }),
    todo({ id: 'se2', text: '장보기',      note: '우유 달걀', createdAt: 2 }),
    todo({ id: 'se3', text: 'React Study', note: '',       createdAt: 1 }),
  ];
  let win;

  function search(win, q) {
    const el = win.document.getElementById('searchInput');
    el.value = q;
    el.dispatchEvent(new win.Event('input'));
  }

  beforeEach(() => { win = boot(TODOS); });

  test('텍스트로 필터링', () => {
    search(win, '리액트');
    expect(win.document.querySelectorAll('.todo-item').length).toBe(1);
    expect(win.document.querySelector('.todo-text').textContent).toBe('리액트 공부');
  });

  test('메모 내용으로 필터링', () => {
    search(win, '우유');
    expect(win.document.querySelectorAll('.todo-item').length).toBe(1);
    expect(win.document.querySelector('.todo-text').textContent).toBe('장보기');
  });

  test('대소문자 구분 없음', () => {
    search(win, 'react');
    expect(win.document.querySelectorAll('.todo-item').length).toBe(1);
  });

  test('검색어 초기화 시 전체 표시', () => {
    search(win, '리액트');
    win.document.getElementById('searchClear').click();
    expect(win.document.querySelectorAll('.todo-item').length).toBe(3);
  });
});

// ── 정렬 ──────────────────────────────────────────────────────────────────

describe('정렬', () => {
  const TODOS = [
    todo({ id: 'so1', text: '나', priority: 'low',    due: '2025-06-01', createdAt: 3 }),
    todo({ id: 'so2', text: '가', priority: 'high',   due: '2025-01-01', createdAt: 2 }),
    todo({ id: 'so3', text: '다', priority: 'medium', due: '',           createdAt: 1 }),
  ];
  let win;

  function sort(win, value) {
    const el = win.document.getElementById('sortSelect');
    el.value = value;
    el.dispatchEvent(new win.Event('change'));
  }

  beforeEach(() => { win = boot(TODOS); });

  test('기본: 최신순 (createdAt 내림차순)', () => {
    expect(renderedTexts(win)).toEqual(['나', '가', '다']);
  });

  test('우선순위순: high → medium → low', () => {
    sort(win, 'priority');
    expect(renderedTexts(win)).toEqual(['가', '다', '나']);
  });

  test('가나다순', () => {
    sort(win, 'alpha');
    expect(renderedTexts(win)).toEqual(['가', '나', '다']);
  });

  test('마감일순: 빠른 날짜 먼저, 없음은 마지막', () => {
    sort(win, 'due');
    expect(renderedTexts(win)).toEqual(['가', '나', '다']); // 2025-01, 2025-06, 없음
  });
});

// ── 일괄 처리 ─────────────────────────────────────────────────────────────

describe('일괄 처리', () => {
  const TODOS = [
    todo({ id: 'ba1', text: '항목1', done: false, createdAt: 2 }),
    todo({ id: 'ba2', text: '항목2', done: true,  createdAt: 1 }),
  ];
  let win;
  beforeEach(() => { win = boot(TODOS); });

  test('모두 완료: 전체 done=true', () => {
    win.document.getElementById('completeAll').click();
    expect(storedTodos(win).every(t => t.done)).toBe(true);
    expect(win.document.querySelectorAll('.todo-item.completed').length).toBe(2);
  });

  test('모두 완료 → 다시 클릭: 전체 done=false', () => {
    win.document.getElementById('completeAll').click();
    win.document.getElementById('completeAll').click();
    expect(storedTodos(win).every(t => !t.done)).toBe(true);
  });

  test('완료 항목 삭제: 미완료만 남는다', () => {
    win.document.getElementById('clearCompleted').click();
    const todos = storedTodos(win);
    expect(todos).toHaveLength(1);
    expect(todos[0].done).toBe(false);
    expect(todos[0].text).toBe('항목1');
  });
});

// ── 드래그 앤 드롭 ────────────────────────────────────────────────────────

describe('드래그 앤 드롭 순서 변경', () => {
  // createdAt 내림차순 렌더: dd1(2) → dd2(1)
  const TODOS = [
    todo({ id: 'dd1', text: '첫번째', createdAt: 2 }),
    todo({ id: 'dd2', text: '두번째', createdAt: 1 }),
  ];
  let win;
  beforeEach(() => { win = boot(TODOS); });

  test('두번째 항목을 첫번째 위치로 드롭하면 순서 변경', () => {
    const items = win.document.querySelectorAll('.todo-item');
    const first  = items[0]; // dd1
    const second = items[1]; // dd2

    // dd2를 dd1 위치로 드래그
    second.dispatchEvent(dragEvent('dragstart', win));
    first.dispatchEvent(dragEvent('dragover',  win));
    first.dispatchEvent(dragEvent('drop',      win));
    second.dispatchEvent(dragEvent('dragend',  win));

    const todos = storedTodos(win);
    expect(todos[0].id).toBe('dd2');
    expect(todos[1].id).toBe('dd1');
  });

  test('같은 항목에 드롭하면 순서 변경 없음', () => {
    const first = win.document.querySelectorAll('.todo-item')[0]; // dd1

    first.dispatchEvent(dragEvent('dragstart', win));
    first.dispatchEvent(dragEvent('dragover',  win));
    first.dispatchEvent(dragEvent('drop',      win));
    first.dispatchEvent(dragEvent('dragend',  win));

    const todos = storedTodos(win);
    expect(todos[0].id).toBe('dd1');
    expect(todos[1].id).toBe('dd2');
  });
});

// ── 테마 ──────────────────────────────────────────────────────────────────

describe('테마 전환', () => {
  let win;
  beforeEach(() => { win = boot(); });

  test('기본 테마는 light', () => {
    expect(win.document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('클릭 시 dark로 전환, localStorage 저장', () => {
    win.document.getElementById('themeToggle').click();
    expect(win.document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(win.localStorage.getItem('todo2_theme')).toBe('dark');
  });

  test('다시 클릭 시 light로 복귀', () => {
    win.document.getElementById('themeToggle').click();
    win.document.getElementById('themeToggle').click();
    expect(win.document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

// ── localStorage 복원 ─────────────────────────────────────────────────────

describe('localStorage 데이터 복원', () => {
  test('저장된 todos를 앱 시작 시 불러온다', () => {
    const saved = [todo({ id: 'ls1', text: '복원 테스트', done: false })];
    const win = boot(saved);

    expect(win.document.querySelectorAll('.todo-item').length).toBe(1);
    expect(win.document.querySelector('.todo-text').textContent).toBe('복원 테스트');
  });

  test('localStorage 손상 시 빈 목록으로 시작', () => {
    const dom = new JSDOM(INDEX_HTML, { runScripts: 'dangerously', url: 'http://localhost' });
    dom.window.localStorage.setItem('todo2_todos', 'INVALID_JSON{{');

    const script = dom.window.document.createElement('script');
    script.textContent = APP_JS;
    dom.window.document.body.appendChild(script);

    expect(dom.window.document.querySelectorAll('.todo-item').length).toBe(0);
  });
});
