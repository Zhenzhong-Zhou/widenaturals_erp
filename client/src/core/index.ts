/**
 * Core application structure components.
 *
 * These components define the top-level application shell,
 * non-blocking bootstrap behavior, and root content composition.
 *
 * Responsibilities:
 * - Establish a stable, immediately paintable application frame
 * - Trigger non-blocking bootstrap side effects
 * - Surface fatal bootstrap errors at the application boundary
 *
 * MUST NOT:
 * - Block initial rendering
 * - Depend on routing, permissions, or business logic
 * - Gate UI on authentication or readiness state
 */
export { default as AppShell } from './AppShell';
export { default as AppBootstrapErrorBoundary } from './AppBootstrapErrorBoundary';
export { default as AppContent } from './AppContent';
