/**
 * Application bootstrap infrastructure.
 *
 * This module contains non-blocking, application-wide initialization
 * logic that runs once per page load.
 *
 * Scope:
 * - Cross-cutting infrastructure concerns (e.g. CSRF bootstrap)
 * - Application lifecycle orchestration
 * - Fatal bootstrap error detection
 *
 * Characteristics:
 * - Executes asynchronously after first paint
 * - Does NOT block rendering or gate application readiness
 * - Does NOT handle authentication or permissions
 *
 * Usage:
 * - Consumed exclusively by core-level bootstrap boundaries
 * - MUST NOT be imported by feature modules or UI components
 */

export { bootstrapCsrf } from './bootstrapCsrf';
export { default as useInitializeApp } from './useInitializeApp';
export { default as AppBootstrapGate } from './AppBootstrapGate';
