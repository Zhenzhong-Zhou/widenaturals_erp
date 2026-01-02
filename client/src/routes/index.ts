/**
 * Public exports for the routing module.
 * This file intentionally contains no logic.
 */

// Main routing entry points
export { default as AppRoutes } from './AppRoutes';
export { default as AppBootstrapGate } from './AppBootstrapGate';

// Route guards
export { default as ProtectedRoutes } from './ProtectedRoutes';
export { default as GuestRoute } from './GuestRoute';
export { default as PermissionGuard } from './PermissionGuard';

// Route configuration & metadata
export { appRoutes } from './router.config';
export { navigationItems } from './navigation.config';

// Route typing helpers
export * from './routeTypes';

// Route utility helpers
export * from './routeUtils';
