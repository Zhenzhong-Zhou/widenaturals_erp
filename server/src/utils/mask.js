/**
 * Masks sensitive information like emails or API keys.
 * @param {string} data - The data to mask.
 * @param {string} type - The type of data (e.g., 'email', 'apiKey').
 * @returns {string} - The masked data.
 */
const maskSensitiveInfo = (data, type) => {
  if (type === 'email') {
    return data.replace(/(.{2})(.*)(?=@)/, (match, p1, p2) => `${p1}***`);
  }
  if (type === 'apiKey') {
    return data.slice(0, 4) + '****' + data.slice(-4);
  }
  if (type === 'userId') {
    return data.slice(0, 2) + '***' + data.slice(-2);
  }
  return data; // Default: return unmodified data
};

module.exports = { maskSensitiveInfo };
