import { createServerSupabaseClient } from './supabase';
import type { UserRole } from './database.types';

/**
 * 현재 인증된 사용자 정보를 반환합니다.
 * getUser()는 서버에서 검증하므로 getSession()보다 안전합니다.
 */
export async function getAuthUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * public.users 테이블에서 현재 사용자의 역할을 조회합니다.
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>();

  if (error || !data) return null;
  return data.role;
}

/**
 * 일반회원(user) 권한을 확인합니다.
 * 권한이 없으면 Error를 throw합니다.
 */
export async function requireUser(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'user') {
    throw new Error('FORBIDDEN: 일반회원 권한이 필요합니다.');
  }
}

/**
 * 관리자(admin) 권한을 확인합니다.
 * 권한이 없으면 Error를 throw합니다.
 */
export async function requireAdmin(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'admin') {
    throw new Error('FORBIDDEN: 관리자 권한이 필요합니다.');
  }
}
