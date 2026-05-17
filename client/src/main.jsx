import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App.jsx';

// Initialize Sentry as early as possible so it captures errors during
// the rest of the bootstrap. Silent no-op if VITE_SENTRY_DSN is unset.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
  });
}

import './styles/shared.css';
import './styles/home.css';
import './styles/shop.css';
import './styles/tools.css';
import './styles/profile.css';
import './styles/extras.css';
import './styles/auth.css';
import './styles/parallax.css';
import './styles/glow-card.css';
import './styles/fragrance.css';
import './styles/legal.css';
import './styles/cart.css';
import './styles/story.css';
import './styles/tailwind.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
