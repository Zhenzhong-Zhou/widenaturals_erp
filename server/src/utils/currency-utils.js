const { logSystemException } = require('../utils/system-logger');
const AppError = require('./AppError');

/**
 * Convert an amount to the system's base currency.
 *
 * @param {number} amount - Amount to convert.
 * @param {string|null} currency - Source currency code (e.g. "USD").
 * @param {number|null} exchangeRate - Rate for conversion to base (e.g. 1 USD = 1.36 CAD → 1.36).
 * @param {string} [systemBaseCurrency='CAD'] - Default system currency.
 * @returns {number} Amount converted to base currency.
 */
const convertToBaseCurrency = (
  amount,
  currency,
  exchangeRate,
  systemBaseCurrency = 'CAD'
) => {
  const round = (num) => Number((num ?? 0).toFixed(4));
  if (!amount || amount === 0) return 0;

  // already base or unknown currency
  if (!currency || currency === systemBaseCurrency) return round(amount);

  // proper rate
  if (exchangeRate && exchangeRate > 0) {
    return round(amount * exchangeRate);
  }

  // validation-level issue, not a crash
  const validationErr = AppError.validationError(
    `Missing or invalid exchange rate for ${currency}`,
    {
      currency,
      exchangeRate,
      baseCurrency: systemBaseCurrency,
      hint: 'Defaulting to 1:1 conversion rate.',
    }
  );

  logSystemException(validationErr, 'Currency conversion fallback to 1:1', {
    context: 'convertToBaseCurrency',
    severity: 'warning',
  });

  return round(amount);
};

module.exports = {
  convertToBaseCurrency,
};
