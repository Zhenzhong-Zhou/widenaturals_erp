/**
 * Application entry point.
 *
 * Responsibilities:
 * - Initialize React root
 * - Provide Redux store to the application
 * - Rehydrate persisted state before rendering
 *
 * Design notes:
 * - `PersistGate` is intentionally lightweight to avoid blocking paint
 * - Global loading UX is handled inside the application, not here
 * - `StrictMode` is enabled to surface unsafe lifecycle usage in development
 */

import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@store/store';
import App from './App';
import '@styles/global.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

/**
 * Minimal PersistGate fallback to allow early paint
 * without introducing visual noise or blocking UX.
 */
const PersistFallback = () => <div style={{ height: 1 }} />;

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={<PersistFallback />}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);
