/**
 * Authorization & permission hooks.
 *
 * This module exposes reusable hooks for evaluating user permissions
 * and deriving permission-based UI state.
 *
 * Design principles:
 * - Hooks are synchronous and side effect free
 * - No navigation or data fetching occurs here
 * - Permission resolution is handled upstream (PermissionsContext)
 *
 * Intended usage:
 * - Route guards → PermissionGuard
 * - Page / component logic → hooks from this module
 * - Business rules → pure utilities (e.g. actionPermissionRules)
 */

// Checks whether the current user has one or more permissions
export { default as useHasPermission } from './useHasPermission';

// Evaluates permission + contextual state (e.g. status) for actions/buttons
export { default as useActionPermission } from './useActionPermission';

// Lightweight page-level permission state (no redirects, no loading)
export { default as usePagePermissionState } from './usePagePermissionState';
