import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configured = Boolean(url && key);

export const supabase = createClient(url || 'http://localhost', key || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 10 } },
});

/** Garantiza una sesión anónima: cada dispositivo es un usuario del proveedor. */
export async function ensureSession(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error || !signed.user) throw new Error('sin_sesion');
  return signed.user.id;
}
