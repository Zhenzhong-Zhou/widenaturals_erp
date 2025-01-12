import { createContext, FC, ReactNode, useContext, useState, useCallback } from 'react';
import { Loading } from '@components/index';

interface LoadingContextType {
  showLoading: (message?: string, variant?: 'spinner' | 'linear' | 'dotted') => void;
  hideLoading: () => void;
}

interface LoadingState {
  loading: boolean;
  message?: string;
  variant?: 'spinner' | 'linear' | 'dotted';
}

interface LoadingProviderProps {
  children: ReactNode;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: FC<LoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({ loading: false });
  
  const showLoading = useCallback((message?: string, variant: 'spinner' | 'linear' | 'dotted' = 'spinner') => {
    setLoadingState({ loading: true, message, variant });
  }, []);
  
  const hideLoading = useCallback(() => {
    setLoadingState({ loading: false, message: undefined, variant: undefined });
  }, []);
  
  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {loadingState.loading && (
        <Loading
          fullPage
          message={loadingState.message}
          variant={loadingState.variant}
        />
      )}
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
