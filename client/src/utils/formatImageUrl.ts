const staticBaseURL = import.meta.env.VITE_STATIC_BASE_URL;

/**
 * Normalizes an image URL returned from the backend.
 *
 * - If the URL is `null` or empty → returns an empty string (safe fallback).
 * - If the URL is already absolute (`http`/`https`) → returned unchanged.
 * - If the URL is relative (e.g., `/uploads/...`) → prepends the configured
 *   `staticBaseURL` to produce a valid, fully qualified URL for the client.
 *
 * Use this function whenever rendering product images, SKU images, or any
 * asset stored in your CDN/static hosting layer to ensure consistent URL
 * resolution across environments (dev, staging, production).
 */
export const formatImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${staticBaseURL}${url}`;
};
