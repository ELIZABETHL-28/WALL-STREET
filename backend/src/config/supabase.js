const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Indicar en arranque si las variables faltan, sin imprimir sus valores.
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL' ||
    !supabaseKey || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn(
    '[Supabase] SUPABASE_URL o SUPABASE_ANON_KEY no están configuradas. ' +
    'La autenticación no estará disponible hasta configurar estas variables en .env.'
  );
}

// Crear el cliente solo cuando las variables tengan valores reales.
// Si no están configuradas, se exporta null y los middlewares responden 503.
let supabase = null;

const urlValida  = supabaseUrl  && supabaseUrl  !== 'YOUR_SUPABASE_URL';
const keyValida  = supabaseKey  && supabaseKey  !== 'YOUR_SUPABASE_ANON_KEY';

if (urlValida && keyValida) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('[Supabase] Error al crear el cliente:', err.message);
  }
}

module.exports = supabase;
