import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

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
import './styles/tailwind.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
