import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
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
import { ReadingProgress } from './components/ReadingProgress.jsx';
import { SearchPalette } from './components/SearchPalette.jsx';
import { trackPageView } from './lib/analytics.js';

// Route-level code splitting. Only HomePage ships in the initial
// bundle, every other route is a separate chunk fetched on navigation.
// Cuts the main bundle from ~200KB gzip to roughly half by deferring
// ProfilePage (AI + reviews + blends), ToolsPage (AI tools), and
// FragrancePage (heavy detail page) until the user actually visits them.
import { HomePage } from './pages/HomePage.jsx';
const ShopPage     = lazy(() => import('./pages/ShopPage.jsx').then(m => ({ default: m.ShopPage })));
const ToolsPage    = lazy(() => import('./pages/ToolsPage.jsx').then(m => ({ default: m.ToolsPage })));
const ProfilePage  = lazy(() => import('./pages/ProfilePage.jsx').then(m => ({ default: m.ProfilePage })));
const ExtrasPage   = lazy(() => import('./pages/ExtrasPage.jsx').then(m => ({ default: m.ExtrasPage })));
const FragrancePage = lazy(() => import('./pages/FragrancePage.jsx').then(m => ({ default: m.FragrancePage })));
const NotePage     = lazy(() => import('./pages/NotePage.jsx').then(m => ({ default: m.NotePage })));
const BrandPage    = lazy(() => import('./pages/BrandPage.jsx').then(m => ({ default: m.BrandPage })));
const StoryPage    = lazy(() => import('./pages/StoryPage.jsx').then(m => ({ default: m.StoryPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx').then(m => ({ default: m.NotFoundPage })));
const LoginPage    = lazy(() => import('./pages/LoginPage.jsx').then(m => ({ default: m.LoginPage })));
const SignupPage   = lazy(() => import('./pages/SignupPage.jsx').then(m => ({ default: m.SignupPage })));
const PrivacyPage  = lazy(() => import('./pages/LegalPage.jsx').then(m => ({ default: m.PrivacyPage })));
const TermsPage    = lazy(() => import('./pages/LegalPage.jsx').then(m => ({ default: m.TermsPage })));

// About page pulls in GSAP for the parallax hero, lazy-load so it
// doesn't ship with the initial bundle.
const AboutPage = lazy(() => import('./pages/AboutPage.jsx').then(m => ({ default: m.AboutPage })));

// Intro spray pulls in three.js + R3F + drei, lazy-load so those
// ~150KB only download for the user's first visit of the session.
const IntroSpray = lazy(() => import('./components/IntroSpray.jsx').then(m => ({ default: m.IntroSpray })));

const INTRO_KEY = 'sl-intro-played-v1';

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
          <Route path="/notes/:slug" element={<NotePage />} />
          <Route path="/brand/:slug" element={<BrandPage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Catch-all 404, must be last so explicit routes win */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  // Show the intro spray once per session. sessionStorage clears when
  // the user closes the tab/browser, so they see the animation again
  // on their next visit but not on every refresh of an active session.
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return !sessionStorage.getItem(INTRO_KEY); } catch { return false; }
  });

  function finishIntro() {
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* private mode */ }
    setShowIntro(false);
  }

  return (
    <AppProvider>
      <Cursor />
      <ReadingProgress />
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
      <SearchPalette />
      {showIntro && (
        <Suspense fallback={null}>
          <IntroSpray onFinish={finishIntro} />
        </Suspense>
      )}
    </AppProvider>
  );
}
