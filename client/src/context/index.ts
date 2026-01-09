/**
 * Global application context providers.
 *
 * Purpose:
 * - Centralized export surface for top-level React context providers
 *   that must wrap the application root.
 *
 * Architectural scope:
 * - Providers exported here are application-wide
 * - They manage cross-cutting concerns (theme, loading state, permissions)
 * - They are NOT feature-specific
 *
 * Usage:
 * - Imported exclusively by the application root (e.g. App.tsx)
 * - Should NOT be imported directly inside feature modules
 *
 * Design principles:
 * - No business logic
 * - No domain state
 * - No authentication or session ownership
 * - Pure composition and context wiring
 */

// UI theming (Redux-backed, persisted UX state)
export { default as ThemeProviderWrapper } from './ThemeProviderWrapper';

// Global loading / progress indicators
export { LoadingProvider } from './LoadingContext';

// Permission evaluation context (runtime, auth-dependent)
export { PermissionsProvider } from './PermissionsContext';
