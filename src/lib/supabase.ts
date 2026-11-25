/**
 * Supabase client — only loaded when the env vars are present AND the user
 * opens a shared room, so solo mode never downloads it.
 * Only the public anon key is used; all access is enforced by RLS + RPCs
 * defined in supabase/schema.sql.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = !!(url && key && /^https:\/\//.test(url));

let client: Promise<SupabaseClient> | null = null;

export function getSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured) return Promise.reject(new Error('Supabase is not configured'));
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'study-paws-auth' },
      realtime: { params: { eventsPerSecond: 10 } },
    }),
  );
  return client;
}

/** Anonymous sign-in: no emails, no passwords, no personal data. */
export async function ensureSession(sb: SupabaseClient) {
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session;
  const res = await sb.auth.signInAnonymously();
  if (res.error || !res.data.session) {
    throw new Error(
      res.error?.message?.includes('Anonymous')
        ? 'Anonymous sign-ins are disabled in your Supabase project (Auth → Providers → Anonymous).'
        : res.error?.message || 'Could not sign in',
    );
  }
  return res.data.session;
}
