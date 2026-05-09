// Polyfill fix for libraries trying to overwrite window.fetch
// In sandbox environments, window.fetch might be a non-writable getter
try {
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    let currentFetch = originalFetch;

    try {
      Object.defineProperty(window, 'fetch', {
        value: originalFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch (e1) {
      try {
        Object.defineProperty(window, 'fetch', {
          get: () => currentFetch,
          set: (v) => { currentFetch = v; },
          configurable: true,
          enumerable: true
        });
      } catch (e2) {
        try {
          const proto = Object.getPrototypeOf(window);
          if (proto) {
            Object.defineProperty(proto, 'fetch', {
              get: () => currentFetch,
              set: (v) => { currentFetch = v; },
              configurable: true,
              enumerable: true
            });
          }
        } catch (e3) {
          // If all else fails, some environments just don't allow it
        }
      }
    }
  }
} catch (e) {
  // Global catch
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
