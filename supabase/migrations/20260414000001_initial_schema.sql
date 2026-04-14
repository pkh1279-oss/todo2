-- ============================================================
-- 코칭 로그 관리 앱 초기 스키마
-- ============================================================

-- ─── users 테이블 ──────────────────────────────────────────────
-- auth.users를 참조하는 public.users 프로필 테이블
-- Supabase Auth 가입 시 트리거로 자동 생성됨
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL UNIQUE,
  role       TEXT        NOT NULL DEFAULT 'user'
                         CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── customers 테이블 ─────────────────────────────────────────
-- 일반회원이 관리하는 코칭 고객 목록
CREATE TABLE IF NOT EXISTS public.customers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  contact    TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── logs 테이블 ──────────────────────────────────────────────
-- 고객별 코칭 세션 일지
CREATE TABLE IF NOT EXISTS public.logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  date          DATE        NOT NULL,
  coaching_time TEXT,                   -- 예: "1시간 30분"
  sessions      INTEGER,               -- 몇 회기
  location      TEXT,                  -- 예: "온라인 Zoom"
  topic         TEXT,                  -- 코칭 주제
  goal          TEXT,                  -- 세션 목표
  action_plan   TEXT,                  -- 실행 계획
  notes         TEXT,                  -- 기타 특이사항
  remarks       TEXT,                  -- 비고
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 인덱스 ───────────────────────────────────────────────────
-- 고객 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_customers_user_id  ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name     ON public.customers(name);
-- 로그 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_logs_customer_id   ON public.logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_logs_date          ON public.logs(date DESC);

-- ─── Row Level Security 활성화 ────────────────────────────────
ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs       ENABLE ROW LEVEL SECURITY;

-- ─── users 테이블 RLS 정책 ─────────────────────────────────────
-- 자신의 프로필만 조회/수정 가능
CREATE POLICY "users: 본인 프로필 조회"
  ON public.users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "users: 본인 프로필 수정"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- ─── customers 테이블 RLS 정책 ────────────────────────────────
-- role='user'인 소유자만 자신의 고객 데이터에 접근
-- 관리자(admin)는 의도적으로 접근 불가 (비밀 유지)
CREATE POLICY "customers: 소유자 전체 접근"
  ON public.customers FOR ALL
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND (
      SELECT role FROM public.users WHERE id = (SELECT auth.uid())
    ) = 'user'
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      SELECT role FROM public.users WHERE id = (SELECT auth.uid())
    ) = 'user'
  );

-- ─── logs 테이블 RLS 정책 ─────────────────────────────────────
-- customers 테이블을 통해 소유자 검증 (관리자 접근 불가)
CREATE POLICY "logs: 소유자 전체 접근"
  ON public.logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      JOIN public.users u ON u.id = c.user_id
      WHERE c.id = logs.customer_id
        AND c.user_id = (SELECT auth.uid())
        AND u.role = 'user'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      JOIN public.users u ON u.id = c.user_id
      WHERE c.id = logs.customer_id
        AND c.user_id = (SELECT auth.uid())
        AND u.role = 'user'
    )
  );
