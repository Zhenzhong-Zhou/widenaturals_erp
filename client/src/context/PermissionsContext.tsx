import { createContext, useContext, type ReactNode } from 'react';

/**
 * Runtime permissions context value.
 *
 * Represents the current permission state for the authenticated user.
 * This state may be partially resolved during initial application render.
 *
 * Semantics:
 * - `roleName` may be `null` while permission data is still hydrating
 * - `permissions` always reflects the raw permission identifiers
 * - `ready` indicates whether permission resolution has completed
 *
 * Notes:
 * - Consumers MUST account for `ready === false`
 * - Permission evaluation logic must be delegated to `useHasPermission`
 */
interface PermissionsContextValue {
  /** Current role name, or null if not yet resolved */
  roleName: string | null;
  
  /** Raw permission identifiers assigned to the user */
  permissions: string[];
  
  /** Last unrecoverable permission error, if any */
  error: string | null;
  
  /** Indicates whether permission data has fully resolved */
  ready: boolean;
}

/**
 * Props for {@link PermissionsProvider}.
 *
 * Extends the context value with React children.
 */
interface PermissionsProviderProps extends PermissionsContextValue {
  children: ReactNode;
}

/**
 * Internal permissions context.
 *
 * Initialized as `undefined` to allow strict runtime enforcement
 * via {@link usePermissionsContext}.
 */
const PermissionsContext =
  createContext<PermissionsContextValue | undefined>(undefined);

/**
 * PermissionsProvider
 *
 * Provides permission and role state to descendant components
 * via React Context.
 *
 * Responsibilities:
 * - Distribute permission state resolved by `usePermissions`
 * - Enable permission-aware hooks and guards
 *
 * Characteristics:
 * - Non-blocking: renders immediately, even if permissions are not ready
 * - Passive: contains no side effects or data fetching
 *
 * MUST NOT:
 * - Fetch permissions
 * - Evaluate permissions
 * - Perform navigation or redirects
 */
export const PermissionsProvider = ({
                                      roleName,
                                      permissions,
                                      error,
                                      ready,
                                      children,
                                    }: PermissionsProviderProps) => {
  return (
    <PermissionsContext.Provider value={{ roleName, permissions, error, ready }}>
      {children}
    </PermissionsContext.Provider>
  );
};

/**
 * usePermissionsContext
 *
 * Accessor hook for the runtime permissions context.
 *
 * Usage:
 * - Permission evaluation hooks (`useHasPermission`)
 * - Route guards
 * - Layout-level permission-aware rendering
 *
 * @throws Error if invoked outside of {@link PermissionsProvider}
 */
export const usePermissionsContext = (): PermissionsContextValue => {
  const context = useContext(PermissionsContext);
  
  if (!context) {
    throw new Error(
      'usePermissionsContext must be used within PermissionsProvider'
    );
  }
  
  return context;
};
