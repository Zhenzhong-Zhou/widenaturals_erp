import { FC } from 'react';
import { BrowserRouter } from 'react-router-dom';
import GlobalErrorBoundary from '@components/shared/GlobalErrorBoundary';
import FallbackUI from '@components/shared/FallbackUI';
import { ThemeProviderWrapper, LoadingProvider } from '@context/index';
import AppContent from '@core/AppContent';

const App: FC = () => (
  <GlobalErrorBoundary
    fallback={
      <FallbackUI
        title="Critical Error"
        description="An unexpected error occurred. Please refresh the page or contact support."
        errorCode="APP-5001"
        errorLog="Critical application failure during initialization."
        onRetry={() => window.location.reload()} // Retry logic
      />
    }
    onError={(error, errorInfo) => {
      console.error('Global Error:', error, errorInfo); // Optional logging
    }}
  >
    <ThemeProviderWrapper>
      <LoadingProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LoadingProvider>
    </ThemeProviderWrapper>
  </GlobalErrorBoundary>
);

export default App;
