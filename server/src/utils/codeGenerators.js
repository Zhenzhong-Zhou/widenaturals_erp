const { logError } = require('./logger-helper');

/**
 * Clean and normalize a name string.
 * Trims whitespace and handles null/undefined input gracefully.
 * @param {string} name - Input name string.
 * @returns {string} - Cleaned name string.
 */
const cleanName = (name) => (name || '').trim();

/**
 * Generate an abbreviation from a name.
 * E.g., "Friends and Family" → "FAF"
 * @param {string} name - Input name string to abbreviate.
 * @param {number} maxLength - Maximum length of the abbreviation. Default is 4.
 * @returns {string} - Abbreviated uppercase string.
 */
const generateAbbreviation = (name, maxLength = 4) => {
  return name
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength);
};

/**
 * Generate a URL-safe slug from a name.
 * E.g., "Friends and Family Price" → "friends_and_family_price"
 * @param {string} name - Input name string.
 * @returns {string} - Slugified string with underscores, lowercase, and sanitized.
 */
const generateSlugOnly = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 50);
};

/**
 * Generate a standardized code for structured entities.
 * Useful for supplier codes, product codes, etc.
 * E.g., generateStandardizedCode('SUP', 'Natural Source', { regionCode: 'CA', sequenceNumber: 7 }) → 'SUP-NS-CA007'
 *
 * @param {string} prefix - Entity prefix (e.g., 'SUP', 'ORD').
 * @param {string} name - Name to base the abbreviation on.
 * @param {object} options - Optional config.
 * @param {string} [options.regionCode] - Optional region code to append (e.g., 'CA').
 * @param {number|string} [options.sequenceNumber=1] - Sequence number to pad.
 * @param {number} [options.padLength=3] - Number of digits to pad the sequence. Default is 3.
 * @returns {string} - Structured standardized code.
 */
const generateStandardizedCode = (
  prefix,
  name,
  { regionCode = '', sequenceNumber = 1, padLength = 3 } = {}
) => {
  try {
    const cleanAbbr = generateAbbreviation(cleanName(name), 3);
    const paddedNum = String(sequenceNumber).padStart(padLength, '0');
    const regionPart = regionCode ? `-${regionCode.toUpperCase()}` : '';
    return `${prefix}-${cleanAbbr}${regionPart}${paddedNum}`;
  } catch (error) {
    logError('[generateStandardizedCode] Error:', error.message);
    return '';
  }
};

/**
 * Generate either a structured code or a URL-friendly slug based on the input name.
 * Slug mode outputs lowercase, underscore-delimited strings; otherwise, a prefixed code is returned.
 *
 * @param {string|null} prefix - Prefix to use in code mode (e.g., 'ORD', 'PRC'). Ignored in slug-only mode.
 * @param {string} name - The name string to generate code or slug from.
 * @param {object} options - Configuration options.
 * @param {boolean} [options.slugOnly=false] - If true, return a slug instead of structured code.
 * @param {number} [options.sequenceNumber=1] - Number to use in the padded code suffix.
 * @param {number} [options.padLength=3] - Length to pad the sequence number.
 * @param {string} [options.regionCode=''] - Optional region code (e.g., 'CN').
 * @returns {string} - Either a structured code or a slug string.
 */
const generateCodeOrSlug = (
  prefix,
  name,
  {
    slugOnly = false,
    sequenceNumber = 1,
    padLength = 3,
    regionCode = '',
  } = {}
) => {
  const normalizedName = cleanName(name);
  if (!normalizedName) return '';
  
  if (slugOnly) return generateSlugOnly(normalizedName);
  
  const abbr = generateAbbreviation(normalizedName);
  const padded = String(sequenceNumber).padStart(padLength, '0');
  const regionPart = regionCode ? `-${regionCode.toUpperCase()}` : '';
  return `${prefix}-${abbr}${regionPart}${padded}`;
};

module.exports = {
  cleanName,
  generateAbbreviation,
  generateSlugOnly,
  generateStandardizedCode,
  generateCodeOrSlug,
};
