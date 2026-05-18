import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider } from './context/AppContext.jsx';
import { Cursor } from './components/Cursor.jsx';
import { Toaster } from './components/Toaster.jsx';
import { SourceModal } from './components/SourceModal.jsx';
import { SampleModal } from './components/SampleModal.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';
import { CookieConsent } from './components/CookieConsent.jsx';
import { MobileBottomNav } from './components/MobileBottomNav.jsx';
import { SprayCanvas } from './components/SprayCanvas.jsx';
import { trackPageView } from './lib/analytics.js';

import { HomePage } from './pages/HomePage.jsx';
import { ShopPage } from './pages/ShopPage.jsx';
import { ToolsPage } from './pages/ToolsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ExtrasPage } from './pages/ExtrasPage.jsx';
import { FragrancePage } from './pages/FragrancePage.jsx';
import { StoryPage } from './pages/StoryPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { PrivacyPage, TermsPage } from './pages/LegalPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';

// About page pulls in GSAP for the parallax hero — lazy-load so it
// doesn't ship with the initial bundle.
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

/**
 * Fires a GA page_view on every client-side route change. The underlying
 * gtag is only loaded after the user grants consent, so this is a no-op
 * for users who declined or haven't decided yet.
 */
function PageviewTracker() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    trackPageView(pathname + hash);
  }, [pathname, hash]);
  return null;
}

/**
 * Subtle 200ms fade between routes. Keyed on pathname so AnimatePresence
 * detects route changes. Wrapping <Routes> rather than each page so we
 * don't have to thread motion.div through every page component.
 */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/explore" element={<ExtrasPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/fragrance/:id" element={<FragrancePage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Catch-all 404 — must be last so explicit routes win */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Cursor />
      <ScrollToHash />
      <PageviewTracker />
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <AnimatedRoutes />
      </Suspense>
      <SampleModal />
      <SourceModal />
      <CartDrawer />
      <MobileBottomNav />
      <Toaster />
      <CookieConsent />
      <SprayCanvas />
    </AppProvider>
  );
}
