import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { App } from './App';

const rootEl = document.getElementById('root');
if (rootEl) {
  if (rootEl.hasChildNodes()) {
    hydrateRoot(rootEl, <App />);
  } else {
    createRoot(rootEl).render(<App />);
  }
}

