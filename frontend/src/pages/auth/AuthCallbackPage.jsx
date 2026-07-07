import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../services/supabase';
import { syncUser, getCurrentSystemUser } from '../../services/auth.service';

export default function AuthCallbackPage() {
  const navigate   = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const processCallback = async () => {
      try {
        // Supabase detecta automáticamente los tokens en la URL al llamar getSession.
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !data.session) {
          setError('No se pudo completar la autenticación. Intenta de nuevo.');
          return;
        }

        const accessToken = data.session.access_token;

        await syncUser(accessToken);
        const systemUser = await getCurrentSystemUser(accessToken);

        if (cancelled) return;

        // La ruta se determina desde el backend — nunca desde metadata del frontend.
        navigate(systemUser.rol === 'ADMIN' ? '/admin' : '/perfil', { replace: true });
      } catch {
        if (!cancelled) {
          setError('Ocurrió un error al procesar la autenticación.');
        }
      }
    };

    processCallback();

    return () => { cancelled = true; };
  }, [navigate]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0a', color: '#f0f0f0', padding: '2rem',
      }}>
        <p style={{ color: '#f08080', marginBottom: '1rem' }}>{error}</p>
        <a href="/login" style={{ color: '#c9a84c' }}>Volver al inicio de sesión</a>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0a', color: '#f0f0f0',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
        Procesando autenticación...
      </p>
    </div>
  );
}
