import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas. ' +
    'Configura el archivo .env antes de usar la autenticación.'
  );
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default supabase;
