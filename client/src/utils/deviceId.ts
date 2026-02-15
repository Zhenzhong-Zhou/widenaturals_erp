/**
 * Returns a stable, client-generated device identifier.
 *
 * DESIGN:
 * - The device ID is generated and owned by the client.
 * - It is persisted in `localStorage` and reused across logins
 *   on the same browser/device.
 * - The value is opaque, non-PII, and safe to send to the server
 *   for session grouping and device-level session management.
 *
 * BEHAVIOR:
 * - If a device ID already exists in `localStorage`, it is reused.
 * - If none exists, a new UUID is generated and stored.
 * - If executed in a non-browser environment (SSR / Node),
 *   a fallback identifier is returned.
 * - If `localStorage` is unavailable (privacy mode, sandboxed iframe),
 *   a safe fallback value is returned.
 *
 * SECURITY NOTES:
 * - This identifier MUST NOT be treated as a trusted security signal.
 * - It is used only for session grouping, display, and device-level logout.
 * - Authentication and authorization rely solely on tokens and sessions.
 *
 * @returns {string} Stable device identifier or a safe fallback value
 */
export const getOrCreateDeviceId = (): string => {
  if (typeof window === 'undefined') {
    return 'server';
  }

  try {
    let deviceId = localStorage.getItem('device_id');

    if (!deviceId) {
      deviceId =
        typeof crypto?.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      localStorage.setItem('device_id', deviceId);
    }

    return deviceId;
  } catch {
    return 'unknown';
  }
};
