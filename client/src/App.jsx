import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import { Cursor } from './components/Cursor.jsx';
import { Toaster } from './components/Toaster.jsx';
import { SourceModal } from './components/SourceModal.jsx';
import { SampleModal } from './components/SampleModal.jsx';

import { HomePage } from './pages/HomePage.jsx';
import { ShopPage } from './pages/ShopPage.jsx';
import { ToolsPage } from './pages/ToolsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ExtrasPage } from './pages/ExtrasPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';

// About page pulls in GSAP + Lenis for the parallax hero — lazy-load
// so those ~50KB gzip don't ship with the initial bundle.
const AboutPage = lazy(() => import('./pages/AboutPage.jsx').then(m => ({ default: m.AboutPage })));

function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo({ top: 0, behavior: 'auto' }); return; }
    const t = setTimeout(() => {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(t);
  }, [hash, pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <Cursor />
      <ScrollToHash />
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/explore" element={<ExtrasPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </Suspense>
      <SampleModal />
      <SourceModal />
      <Toaster />
    </AppProvider>
  );
}
