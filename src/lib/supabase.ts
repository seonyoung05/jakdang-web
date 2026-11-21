import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * 백엔드가 준 Project URL이 `.../rest/v1/`로 끝나도 동작하게 기본 주소만 남긴다.
 * (createClient에는 https://<ref>.supabase.co 까지만 넣어야 한다)
 */
function baseUrl(raw: string): string {
  return raw.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

export function isConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function supabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase 환경 변수가 없어요. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 넣어 주세요.');
  }
  client = createClient(baseUrl(url), key);
  return client;
}
