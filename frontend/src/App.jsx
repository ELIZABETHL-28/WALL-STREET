import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage        from './pages/auth/LoginPage';
import RegisterPage     from './pages/auth/RegisterPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import ProfilePage      from './pages/ProfilePage';
import AdminPage        from './pages/AdminPage';
import ReservasPage     from './pages/ReservasPage';
import HomePage          from './pages/HomePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirección raíz */}
          <Route path="/" element={<HomePage />} />

          {/* Autenticación */}
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/registro"      element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Perfil — requiere autenticación y rol CLIENTE */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute requiredRole="CLIENTE">
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Reservaciones CLIENTE */}
          <Route
            path="/reservas"
            element={
              <ProtectedRoute requiredRole="CLIENTE">
                <ReservasPage />
              </ProtectedRoute>
            }
          />

          {/* Admin — requiere autenticación y rol ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Cualquier ruta desconocida */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
