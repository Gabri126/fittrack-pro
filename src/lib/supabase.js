import { createClient } from '@supabase/supabase-js';

// Explicitly reading from import.meta.env for Vite compatibility
const getSupabaseConfig = () => ({
  url: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  key: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
});

const config = getSupabaseConfig();

// Initialize client if config is present
export const supabase = config.url && config.key
  ? createClient(config.url, config.key)
  : null;

// Health check helper to detect DNS/Network issues
export const checkSupabaseHealth = async () => {
  if (!config.url) return { ok: false, error: 'Configurazione mancante' };
  try {
    const res = await fetch(`${config.url}/rest/v1/`, { 
      method: 'GET',
      headers: { 'apikey': config.key }
    });
    return { ok: res.status === 200 || res.status === 404 }; // 404 is actually a good sign (reached server)
  } catch (e) {
    console.error("Health Check Failed:", e);
    return { ok: false, error: e.message };
  }
};

// Helper to check if Supabase is ready
export const isSupabaseReady = () => !!supabase;
