import { FC } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Box from '@mui/material/Box';
import { ThemeProviderWrapper } from './context/ThemeContext.tsx';
import { MainLayout } from './layouts';
import './styles/App.css';

const App: FC = () => (
  <BrowserRouter>
    <ThemeProviderWrapper>
      <Box className={"app"}>
        <MainLayout
          children={undefined} username={''} onLogout={function(): void {
          throw new Error('Function not implemented.');
        }}  />
      </Box>
    </ThemeProviderWrapper>
  </BrowserRouter>
);

export default App;
