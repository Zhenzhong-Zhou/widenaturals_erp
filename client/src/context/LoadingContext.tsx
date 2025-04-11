import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useState,
  useCallback,
} from 'react';
import Loading from '@components/common/Loading';

interface LoadingContextType {
  showLoading: (
    message?: string,
    variant?: 'spinner' | 'linear' | 'dotted'
  ) => void;
  hideLoading: () => void;
  disableGlobalLoading: () => void;
  enableGlobalLoading: () => void;
}

interface LoadingState {
  loading: boolean;
  message?: string;
  variant?: 'spinner' | 'linear' | 'dotted';
  globalEnabled: boolean; // Tracks whether global loading is enabled
}

interface LoadingProviderProps {
  children: ReactNode;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: FC<LoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    loading: false,
    globalEnabled: true, // Default: Global loading is enabled
  });

  const showLoading = useCallback(
    (
      message?: string,
      variant: 'spinner' | 'linear' | 'dotted' = 'spinner'
    ) => {
      setLoadingState((prevState) => ({
        ...prevState,
        loading: true,
        message,
        variant,
      }));
    },
    []
  );

  const hideLoading = useCallback(() => {
    setLoadingState((prevState) => ({
      ...prevState,
      loading: false,
      message: undefined,
      variant: undefined,
    }));
  }, []);

  const disableGlobalLoading = useCallback(() => {
    setLoadingState((prevState) => ({
      ...prevState,
      globalEnabled: false, // Disable global loading
    }));
  }, []);

  const enableGlobalLoading = useCallback(() => {
    setLoadingState((prevState) => ({
      ...prevState,
      globalEnabled: true, // Enable global loading
    }));
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        showLoading,
        hideLoading,
        disableGlobalLoading,
        enableGlobalLoading,
      }}
    >
      {children}
      {loadingState.globalEnabled && loadingState.loading && (
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
