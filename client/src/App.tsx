import { FC } from 'react';
import { BrowserRouter } from 'react-router';
import { ThemeProviderWrapper } from './context';
import { AppContent } from './core';

const App: FC = () => (
  <BrowserRouter>
    <ThemeProviderWrapper>
      <AppContent />
    </ThemeProviderWrapper>
  </BrowserRouter>
);

export default App;
