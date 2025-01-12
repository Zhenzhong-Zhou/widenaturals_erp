import { FC } from 'react';
import { ThemeProviderWrapper } from './context/ThemeContext.tsx';
import './styles/App.css';

const App: FC = () => (
  <ThemeProviderWrapper>
    <div className="app">
    </div>
  </ThemeProviderWrapper>
);

export default App;
