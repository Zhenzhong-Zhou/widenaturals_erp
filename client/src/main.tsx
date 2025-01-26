import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { FallbackUI, GlobalErrorBoundary } from '@components/index.ts';
import { LoadingProvider } from './context';
import { store, persistor } from './store/store';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <GlobalErrorBoundary
      fallback={
        <FallbackUI
          title="Critical Error"
          description="An unexpected error occurred. Please refresh the page or contact support."
          errorCode="APP-5001"
          errorLog="Critical application failure during initialization."
          onRetry={() => window.location.reload()} // Retry logic: reload the page
        />
      }
      onError={(error, errorInfo) => {
        console.error('Logged Error:', error, errorInfo); // Optional custom logging logic
      }}
    >
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <LoadingProvider>
            <App />
          </LoadingProvider>
        </PersistGate>
      </Provider>
    </GlobalErrorBoundary>
  </StrictMode>
);
