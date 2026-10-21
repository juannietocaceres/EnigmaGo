import { lazy, StrictMode, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import { configured, ensureSession } from './lib/supabase';
import { Loader, Notice } from './components/ui';
import Home from './pages/Home';
import Join from './pages/Join';
const Organize = lazy(() => import('./pages/Organize'));
const Console = lazy(() => import('./pages/Console'));
const Board = lazy(() => import('./pages/Board'));
const QrSheet = lazy(() => import('./pages/QrSheet'));
const Play = lazy(() => import('./pages/Play'));

function App() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    if (!configured) { setState('error'); return; }
    ensureSession().then(() => setState('ready')).catch(() => setState('error'));
  }, []);

  if (state === 'loading') return <Loader label="Abriendo el archivo…" />;
  if (state === 'error') return (
    <Notice title="No pudimos conectar"
      text={configured
        ? 'Revisa tu conexión a internet y recarga la página. Si sigue pasando, el organizador debe activar el inicio de sesión anónimo en Supabase.'
        : 'Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver README).'} />
  );
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/organizar" element={<Organize />} />
        <Route path="/evento/:id" element={<Console />} />
        <Route path="/evento/:id/marcador" element={<Board />} />
        <Route path="/evento/:id/qr" element={<QrSheet />} />
        <Route path="/unirse" element={<Join />} />
        <Route path="/jugar/:teamId" element={<Play />} />
        <Route path="*" element={<Notice title="Esta página no existe" text="Vuelve al inicio para crear un evento o unirte con un código." home />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
