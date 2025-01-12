import { createContext, FC, ReactNode, useContext, useState } from 'react';
import { Loading } from '@components/index.ts';

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

interface LoadingProviderProps {
  children: ReactNode; // Define the children prop
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: FC<LoadingProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  
  const showLoading = (msg?: string) => {
    setMessage(msg);
    setLoading(true);
  };
  
  const hideLoading = () => {
    setLoading(false);
    setMessage(undefined);
  };
  
  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {loading && <Loading fullPage message={message} />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
