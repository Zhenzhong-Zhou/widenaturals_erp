const { logError } = require('./logger-helper');

/**
 * Generate a standardized code for entities like suppliers or manufacturers.
 * @param {string} prefix - Entity type, e.g., 'SUP', 'MFG', 'CUS'
 * @param {string} name - Full name to extract abbreviation from.
 * @param {object} [options]
 * @param {string} [options.regionCode] - Optional region code (e.g., 'CN')
 * @param {number|string} [options.sequenceNumber] - Optional number, zero-padded.
 * @param {number} [options.padLength=3]
 * @returns {string}
 */
const generateStandardizedCode = (prefix, name, { regionCode = '', sequenceNumber = 1, padLength = 3 } = {}) => {
  try {
    const cleanAbbr = name
      .split(/\s+/)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
    
    const paddedNum = String(sequenceNumber).padStart(padLength, '0');
    const regionPart = regionCode ? `-${regionCode.toUpperCase()}` : '';
    
    return `${prefix}-${cleanAbbr}${regionPart}${paddedNum}`;
  } catch (error) {
    logError('[generateStandardizedCode] Error.');
    return '';
  }
};

module.exports = {
  generateStandardizedCode,
};