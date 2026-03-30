import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useSocket } from './hooks/useSocket';
import { useEffect } from 'react';

import Landing      from './pages/Landing';
import Auth         from './pages/Auth';
import Onboarding   from './pages/Onboarding';
import MobileApp    from './pages/MobileApp';
import DesktopApp   from './pages/DesktopApp';

// Global toast renderer
function Toasts() {
  const { toasts } = useUIStore();
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{icons[t.type] || 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// Online/offline detector
function NetworkWatcher() {
  const { setOnline } = useUIStore();
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return null;
}

// Socket connector — only when logged in
function SocketConnector() {
  useSocket();
  return null;
}

// Route guard
function Protected({ children }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

// Choose mobile or desktop layout
function AppLayout() {
  const isDesktop = window.innerWidth >= 1024;
  return isDesktop ? <DesktopApp /> : <MobileApp />;
}

export default function App() {
  return (
    <BrowserRouter>
      <NetworkWatcher />
      <SocketConnector />
      <Toasts />
      <Routes>
        <Route path="/"           element={<Landing />} />
        <Route path="/auth"       element={<Auth />} />
        <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
        <Route path="/app/*"      element={<Protected><AppLayout /></Protected>} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
