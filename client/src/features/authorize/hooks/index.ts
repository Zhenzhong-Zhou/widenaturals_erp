/**
 * Authorization & Permission Hooks
 *
 * This module exposes reusable hooks for evaluating user permissions
 * and deriving permission-driven UI behavior across the application.
 *
 * Design principles
 * - Hooks are synchronous and side-effect free
 * - No navigation, redirects, or data fetching occurs here
 * - Permission resolution is handled upstream via PermissionsContext
 *
 * Permission model
 * - `useHasPermission` returns a tri-state result: `true | false | 'pending'`
 * - `useHasPermissionBoolean` provides a UI-safe boolean wrapper
 * - Higher-level hooks (e.g. `useActionPermission`) combine permissions
 *   with contextual rules such as entity status or workflow constraints
 *
 * Intended usage
 * - Route guards → PermissionGuard
 * - Page / component logic → hooks exported from this module
 * - Business rule evaluation → pure utilities (e.g. actionPermissionRules)
 *
 * Architectural notes
 * - Keeps permission logic centralized
 * - Prevents scattered permission checks across components
 * - Ensures consistent handling of the permission "pending" state
 */

// Checks whether the current user has one or more permissions
export { default as useHasPermission } from './useHasPermission';

// Evaluates permission + contextual state (e.g. status) for actions/buttons
export { default as useActionPermission } from './useActionPermission';

// Lightweight page-level permission state (no redirects, no loading)
export { default as usePagePermissionState } from './usePagePermissionState';

// Boolean-safe wrapper for UI permission checks
export { default as useHasPermissionBoolean } from './useHasPermissionBoolean';
