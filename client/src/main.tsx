import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { FallbackUI, GlobalErrorBoundary } from '@components/index.ts';
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
      <App />
    </GlobalErrorBoundary>
  </StrictMode>
);
