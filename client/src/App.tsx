import { FC } from 'react';
import { BrowserRouter } from 'react-router';
import { ThemeProviderWrapper } from './context/ThemeContext';
import { LoadingProvider } from './context/LoadingContext';
import { AppContent } from '../core';

const App: FC = () => (
  <BrowserRouter>
    <ThemeProviderWrapper>
      <LoadingProvider>
        <AppContent />
      </LoadingProvider>
    </ThemeProviderWrapper>
  </BrowserRouter>
);

export default App;
