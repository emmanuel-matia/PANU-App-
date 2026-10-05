import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://xscnbjmiinznzepxzcvn.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_oiSjeHoC_1HnBPIUbfs_4g_dmwCUtyQ';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const supabaseUrl =
  env.NEXT_PUBLIC_SUPABASE_URL ||
  env.VITE_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_KEY;

// Cache mémoire ultra-léger (Stale-While-Revalidate) et timeout court pour connexions lentes (2G/3G)
const fastGetCache = new Map<string, { timestamp: number; body: string; status: number; headers: [string, string][] }>();
const CACHE_TTL_MS = 15000;

const ultraFastFetch: typeof fetch = async (input, init) => {
  const method = (init?.method || 'GET').toUpperCase();
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const isGet = method === 'GET';

  if (isGet) {
    const cached = fastGetCache.get(urlStr);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new Response(cached.body, { status: cached.status, headers: cached.headers });
    }
  } else {
    fastGetCache.clear();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(input, {
      ...init,
      keepalive: true,
      signal: init?.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (isGet && response.ok) {
      const cloned = response.clone();
      cloned.text().then((bodyText) => {
        const headersArr: [string, string][] = [];
        cloned.headers.forEach((v, k) => headersArr.push([k, v]));
        fastGetCache.set(urlStr, {
          timestamp: Date.now(),
          body: bodyText,
          status: cloned.status,
          headers: headersArr,
        });
      }).catch(() => {});
    }
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    const fallback = isGet ? fastGetCache.get(urlStr) : undefined;
    if (fallback) {
      return new Response(fallback.body, { status: fallback.status, headers: fallback.headers });
    }
    throw err;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: ultraFastFetch,
    headers: { 'x-client-info': 'panu-fast-edge' },
  },
  realtime: {
    params: { eventsPerSecond: 20 },
  },
});

export const FOUNDER_EMAIL = 'emmanuelmatia150@gmail.com';

export default supabase;
