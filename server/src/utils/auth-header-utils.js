/**
 * Extracts a Bearer access token from the Authorization header.
 *
 * Expected header format:
 * - `Authorization: Bearer <token>`
 *
 * Invalid, missing, or malformed headers return `null`.
 *
 * @param {import('express').Request} req - Incoming Express request.
 * @returns {string | null} Access token when present and valid in format, otherwise null.
 */
const getAccessTokenFromHeader = (req) => {
  const authHeader = req.get('authorization');
  if (!authHeader || typeof authHeader !== 'string') return null;

  // Normalize whitespace to safely handle headers like "Bearer    <token>".
  const [scheme, token, ...extraParts] = authHeader.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== 'bearer') return null;

  // Reject missing token and malformed values with unexpected extra segments.
  if (!token || extraParts.length > 0) return null;

  return token;
};

module.exports = {
  getAccessTokenFromHeader,
};
