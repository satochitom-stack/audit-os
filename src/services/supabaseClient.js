import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'ia_supabase_config';

/**
 * Get the Supabase credentials from environment or localStorage
 */
export function getSupabaseConfig() {
  const DEFAULT_URL = 'https://kdpxnmtblaminyffdwfe.supabase.co';
  const DEFAULT_KEY = 'sb_publishable_nsrWU0VBRgI5tlHYYvzy8g_658gwW70';

  let url = import.meta.env?.VITE_SUPABASE_URL || DEFAULT_URL;
  let anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

  // Allow localStorage override so Admin can paste credentials directly in app UI
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        url = parsed.url.trim();
        anonKey = parsed.anonKey.trim();
      }
    }
  } catch (e) {
    console.error('Failed to parse Supabase config from localStorage:', e);
  }

  return { url, anonKey };
}

/**
 * Save Supabase credentials to localStorage
 */
export function saveSupabaseConfig(url, anonKey) {
  const cleanUrl = (url || '').trim();
  const cleanKey = (anonKey || '').trim();

  if (!cleanUrl || !cleanKey) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
  }

  // Trigger custom event so components can update connection state
  initClient();
  window.dispatchEvent(new CustomEvent('ia-supabase-config-changed'));
}

/**
 * Checks whether Supabase credentials are configured
 */
export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}

// Client singleton
let supabaseInstance = null;

function initClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return supabaseInstance;
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return null;
}

// Initialize on module load
initClient();

/**
 * Get active Supabase client instance or null
 */
export function getSupabaseClient() {
  if (!supabaseInstance) {
    initClient();
  }
  return supabaseInstance;
}

/**
 * Test connectivity with Supabase
 */
export async function testSupabaseConnection(customUrl = null, customKey = null) {
  try {
    const url = customUrl || getSupabaseConfig().url;
    const anonKey = customKey || getSupabaseConfig().anonKey;

    if (!url || !anonKey) {
      return { success: false, message: 'กรุณากรอกทั้ง Project URL และ Anon Key' };
    }

    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false }
    });

    // Test a lightweight query or auth check
    const { error } = await testClient.from('profiles').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, it's still connected to Supabase
      if (error.code === '42P01') {
        return {
          success: true,
          tableMissing: true,
          message: 'เชื่อมต่อ Supabase สำเร็จ! (แต่ยังไม่ได้รันสคริปต์ supabase_schema.sql ใน SQL Editor)'
        };
      }
      return { success: false, message: error.message || 'การเชื่อมต่อล้มเหลว' };
    }

    return { success: true, tableMissing: false, message: 'เชื่อมต่อฐานข้อมูล Cloud สำเร็จสมบูรณ์!' };
  } catch (err) {
    return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
  }
}
