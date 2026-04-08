/**
 * Resolves a CommonJS module into a usable default export in ESM environments (e.g. Vite).
 *
 * Handles common interop shapes:
 * - Component
 * - { default: Component }
 * - { default: { default: Component } }
 *
 * Ensures a valid function (e.g. React component) is returned.
 * Throws early if resolution fails to prevent runtime rendering errors.
 *
 * @template T - Expected resolved type (e.g. React.ComponentType)
 * @param mod - Imported module (unknown shape)
 * @returns Resolved default export
 * @throws Error if module cannot be resolved to a function
 */
export const resolveCjsDefault = <T>(mod: unknown): T => {
  if (mod == null) {
    throw new Error(
      'resolveCjsDefault: module is undefined or null'
    );
  }
  
  // Case 1: module itself is already the export
  if (typeof mod === 'function') {
    return mod as T;
  }
  
  const m = mod as { default?: unknown };
  
  // Case 2: { default: Component }
  if (typeof m.default === 'function') {
    return m.default as T;
  }
  
  // Case 3: { default: { default: Component } }
  if (
    m.default &&
    typeof (m.default as { default?: unknown }).default === 'function'
  ) {
    return (m.default as { default: T }).default;
  }
  
  throw new Error(
    'resolveCjsDefault: unable to resolve a valid default export (expected function)'
  );
};
