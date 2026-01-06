/**
 * HTTP transport public surface.
 *
 * This module defines the canonical export boundary for all client-side
 * HTTP request utilities. Consumers must import request helpers exclusively
 * from this index to preserve layering, consistency, and policy enforcement.
 *
 * Layered structure (top → bottom):
 *
 * 1. Request helpers (public API)
 *    - High-level, typed helpers used by features and hooks.
 *    - Handle response validation, error normalization, and policy execution.
 *
 * 2. Transport execution layer
 *    - Low-level request runners that apply retry, timeout, and error policies.
 *    - Not intended for direct feature usage.
 *
 * 3. Policy definitions
 *    - Declarative request policy configuration and types.
 *    - Imported by helpers and execution layer only.
 *
 * Architectural rules:
 * - Feature code MUST import from this index, never from deep paths.
 * - Policy and execution utilities must not depend on feature or state modules.
 * - `rawAxios` remains interceptor-free and is safe for bootstrap/auth flows.
 *
 * This boundary ensures:
 * - Predictable request behavior
 * - Centralized policy enforcement
 * - Minimal coupling between transport and feature layers
 */

// ------------------------------------------------------
// Base HTTP client
// ------------------------------------------------------
export * from './rawAxios';

// ------------------------------------------------------
// Request helpers (primary public API)
// ------------------------------------------------------
export * from './getRequest';
export * from './postRequest';
export * from './postFormDataRequest';
export * from './putRequest';
export * from './patchRequest';

// ------------------------------------------------------
// Transport execution layer
// ------------------------------------------------------
export * from './requestWithPolicy';
export * from './requestWithNamedPolicy';

// ------------------------------------------------------
// Policy definitions
// ------------------------------------------------------
export * from './requestPolicies';
export * from './requestPolicyTypes';
