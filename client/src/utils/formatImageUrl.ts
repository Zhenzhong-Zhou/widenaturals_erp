// Trailing-slash-stripped once at module load — staticBaseURL never changes at runtime.
const STATIC_BASE_URL =
  import.meta.env.VITE_STATIC_BASE_URL?.replace(/\/$/, '') ?? '';

// Matches `http://` and `https://`; intentionally not `httpfoo://`.
const ABSOLUTE_URL_REGEX = /^https?:\/\//;

/**
 * Normalizes an image URL returned from the backend into a fully qualified
 * URL suitable for `<img src>` rendering.
 *
 * Resolution rules:
 * - `null` / `undefined` / empty string → `''` (safe fallback; avoids broken
 *   image icons on empty `<img>` tags).
 * - Absolute URL (`http://` or `https://`) → returned unchanged. Covers
 *   presigned S3 URLs in production and any CDN-hosted assets the backend
 *   already resolves to a full URL.
 * - Relative path (e.g. `/uploads/foo.jpg` or `uploads/foo.jpg`) → prefixed
 *   with `VITE_STATIC_BASE_URL`; leading and trailing slashes are normalized
 *   to prevent `//` artifacts.
 *
 * Use for product images, SKU images, and any other backend-resolved asset
 * URL to ensure consistent rendering across dev, staging, and production.
 *
 * @param url - Raw URL string from the backend; may be absolute, relative,
 *              null, or undefined.
 * @returns Fully qualified URL, or `''` when input is missing.
 */
export const formatImageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (ABSOLUTE_URL_REGEX.test(url)) return url;
  return `${STATIC_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
