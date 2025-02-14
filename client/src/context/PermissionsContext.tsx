import { createContext, useContext, ReactNode } from 'react';

interface PermissionsContextType {
  roleName: string;
  permissions: string[];
  error: string | null;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export const PermissionsProvider = ({
  roleName,
  permissions,
  error,
  children,
}: PermissionsContextType & { children: ReactNode }) => {
  return (
    <PermissionsContext.Provider value={{ roleName, permissions, error }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error(
      'usePermissionsContext must be used within PermissionsProvider'
    );
  }
  return context;
};
