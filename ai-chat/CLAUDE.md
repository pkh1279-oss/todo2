# 코칭 로그 관리 앱

## 프로젝트 개요

코칭 고객들의 로그와 내용을 관리하는 웹앱. 일반회원은 고객을 추가하고 로그를 관리할 수 있으며, 관리자는 회원 관리를 담당합니다. 고객 목록은 일반회원만 볼 수 있고, 관리자는 접근할 수 없습니다 (비밀 유지 중요).

- **진입 방법**: 이름 선택 → 코칭 진행한 날짜 목록 → 일지 내용 (보고서 형식)
- **보고서 필드**: 이름, 코칭시간, 몇회기, 장소, 주제, 목표, 실행계획, 기타 특이사항, 비고

---

## 기술 스택

- **프레임워크**: Next.js 15 (App Router, TypeScript)
- **스타일링**: Tailwind CSS
- **백엔드**: Supabase (데이터베이스, 인증)
- **인증**: 이메일 인증 (Supabase Auth)
- **배포**: Vercel

---

## 핵심 기능

### 사용자 관리
- **회원가입/로그인**: 이메일 인증 기반
- **역할**: 일반회원 (고객 로그 관리), 관리자 (회원 관리)
- **회원정보 수정**: 프로필 업데이트

### 고객 및 로그 관리 (일반회원 전용)
- **고객 추가**: 이름, 연락처, 이메일 입력
- **로그 추가/수정/삭제**: 날짜별 세션 기록 (코칭시간, 회기, 장소, 주제, 목표, 실행계획, 특이사항, 비고)
- **목록 보기**: 고객 이름 가나다순 정렬, 이름 클릭 시 날짜 목록 표시, 날짜 클릭 시 보고서 보기
- **데이터 내보내기**: 로그 데이터를 PDF/CSV로 내보내기

### 관리자 기능
- **회원 관리**: 사용자 목록 조회, 권한 관리 (일반회원 ↔ 관리자 전환)

### UI/UX
- **메인 페이지**: 고객 목록 (일반회원만 접근)
- **고객 상세**: 날짜별 로그 목록
- **로그 상세**: 보고서 형식 표시
- **반응형 디자인**: 모바일 친화적
- **에러 처리**: 유효성 검사, 접근 권한 확인

---

## 프로젝트 구조

```
ai-chat/  # (또는 코칭 앱 폴더로 변경 가능)
├── app/
│   ├── layout.tsx
│   ├── page.tsx             # 메인 페이지 (고객 목록)
│   ├── login/
│   │   └── page.tsx         # 로그인 페이지
│   ├── signup/
│   │   └── page.tsx         # 회원가입 페이지
│   ├── profile/
│   │   └── page.tsx         # 프로필 수정
│   └── api/
│       ├── auth/
│       │   └── [...nextauth].ts  # Supabase 인증 라우트
│       ├── customers/
│       │   └── route.ts          # 고객 CRUD API
│       └── logs/
│           └── route.ts           # 로그 CRUD API
├── components/
│   ├── CustomerList.tsx      # 고객 목록 컴포넌트
│   ├── LogList.tsx           # 날짜별 로그 목록
│   ├── LogReport.tsx         # 보고서 표시 컴포넌트
│   ├── AddCustomerForm.tsx   # 고객 추가 폼
│   ├── AddLogForm.tsx        # 로그 추가/수정 폼
│   └── ExportButton.tsx      # 내보내기 버튼
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트 설정
│   └── auth.ts               # 인증 유틸리티
└── CLAUDE.md
```

---

## 데이터베이스 스키마 (Supabase)

### users 테이블
- id (UUID, PK)
- email (string)
- role (enum: 'user', 'admin')  # 일반회원: user, 관리자: admin
- created_at (timestamp)

### customers 테이블
- id (UUID, PK)
- user_id (UUID, FK to users)  # 일반회원만 접근 가능
- name (string)
- contact (string)  # 연락처
- email (string)
- created_at (timestamp)

### logs 테이블
- id (UUID, PK)
- customer_id (UUID, FK to customers)
- date (date)
- coaching_time (string)  # 코칭 시간
- sessions (integer)  # 몇 회기
- location (string)  # 장소
- topic (string)  # 주제
- goal (text)  # 목표
- action_plan (text)  # 실행 계획
- notes (text)  # 기타 특이사항
- remarks (text)  # 비고
- created_at (timestamp)

---

## Supabase 설정

- **인증**: 이메일/비밀번호 기반
- **RLS (Row Level Security)**: customers와 logs는 user_id로 필터링 (관리자 제외)
- **환경변수**:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 서버 사이드용
  ```

---

## 개발 명령어

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

---

## 구현 시 주의사항

- **접근 제어**: 일반회원만 customers/logs에 접근 가능, 관리자는 users만 관리
- **보안**: Supabase RLS 활성화, API 키 서버 사이드만 사용
- **내보내기**: 클라이언트 사이드에서 PDF/CSV 생성 (라이브러리: jsPDF, papaparse)
- **에러 핸들링**: 인증 실패, 권한 부족 시 적절한 메시지 표시
- **유효성 검사**: 폼 입력 시 필수 필드 확인
