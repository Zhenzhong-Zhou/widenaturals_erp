/**
 * @file currency-utils.js
 * @description Utilities for currency conversion to the system base currency.
 *
 * Design intent:
 *  - Conversion failures are recoverable — functions here log warnings and
 *    fall back gracefully rather than throwing, so a bad exchange rate never
 *    crashes a request mid-flight.
 *  - All amounts are rounded to 4 decimal places for consistent precision.
 *
 * Depends on:
 *  - AppError          — for structured validation error creation
 *  - logSystemException (system-logger.js) — for warning-level logging on fallback
 */

const { logSystemException } = require('./logging/system-logger');
const AppError = require('./AppError');

/**
 * Rounds a number to 4 decimal places for consistent currency precision.
 * Treats null/undefined as 0.
 *
 * @param {number|null|undefined} num
 * @returns {number}
 */
const roundCurrency = (num) => Number((num ?? 0).toFixed(4));

/**
 * Converts an amount to the system's base currency using the provided exchange rate.
 *
 * - If amount is 0, null, or undefined, returns 0 immediately.
 * - If currency is missing or already matches the base currency, returns the rounded amount as-is.
 * - If a valid exchange rate is provided, applies it and returns the converted amount.
 * - If the exchange rate is missing or invalid, logs a warning and falls back to a 1:1 rate.
 *   This function never throws — currency conversion failures are treated as recoverable.
 *
 * @param {number|null|undefined} amount          - Amount to convert.
 * @param {string|null|undefined} currency        - Source currency code (e.g. 'USD').
 * @param {number|null|undefined} exchangeRate    - Conversion rate to base currency (e.g. 1.36 means 1 USD = 1.36 CAD).
 * @param {string} [systemBaseCurrency='CAD']     - The system's base currency code.
 * @returns {number} Amount in base currency, rounded to 4 decimal places.
 */
const convertToBaseCurrency = (
  amount,
  currency,
  exchangeRate,
  systemBaseCurrency = 'CAD'
) => {
  // Treat missing or zero amounts as 0 — nothing to convert
  if (!amount || amount === 0) return 0;

  // No conversion needed if currency is unknown or already the base currency
  if (!currency || currency === systemBaseCurrency)
    return roundCurrency(amount);

  // Apply exchange rate if valid
  if (exchangeRate && exchangeRate > 0) {
    return roundCurrency(amount * exchangeRate);
  }

  // Rate is missing or invalid — log and fall back to 1:1 rather than crashing
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

  return roundCurrency(amount);
};

module.exports = {
  convertToBaseCurrency,
};
