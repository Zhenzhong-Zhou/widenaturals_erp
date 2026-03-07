/**
 * @constant ALLOWED_IMAGE_HOSTS
 *
 * @description
 * Immutable list of trusted hostnames that the backend server is permitted
 * to download images from when resolving remote image URLs.
 *
 * This constant is derived from the environment variable:
 *   `ALLOWED_IMAGE_HOSTS`
 *
 * Security Purpose:
 *   Prevents Server-Side Request Forgery (SSRF) by restricting outbound
 *   image fetch operations to explicitly approved infrastructure domains.
 *
 * Expected Format (env):
 *   Comma-separated hostnames without protocol.
 *
 *   Example:
 *   ALLOWED_IMAGE_HOSTS=cdn.widenaturals.com,my-bucket.s3.amazonaws.com,d123abcd.cloudfront.net
 *
 * Important Rules:
 *   • Only include domains fully controlled by your organization.
 *   • Do NOT include social media, marketing sites, or third-party platforms.
 *   • Wildcards (*) are NOT supported.
 *   • Hostnames are normalized to lowercase.
 *
 * Runtime Behavior:
 *   • Parsed once at application boot.
 *   • Trimmed and filtered to remove empty entries.
 *   • Frozen via Object.freeze() to prevent mutation.
 *
 * Used By:
 *   Media processing utilities (e.g., resolveSource, remote image fetch logic).
 */
const ALLOWED_IMAGE_HOSTS = Object.freeze(
  process.env.ALLOWED_IMAGE_HOSTS.split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
);

module.exports = {
  ALLOWED_IMAGE_HOSTS,
};
