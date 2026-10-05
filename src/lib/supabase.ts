import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement Vite avec repli sécurisé sur le projet PANU
const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
  'https://xscnbjmiinznzepxzcvn.supabase.co';

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_oiSjeHoC_1HnBPIUbfs_4g_dmwCUtyQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Garde la session active même après fermeture ou rafraîchissement
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
