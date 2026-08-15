import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경변수가 없으면 null — 화면에서 설정 안내를 보여준다
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
