/**
 * @file batch-utils.js
 * @description Domain utilities for batch records — expiry meta derivation.
 *
 * Pure functions only — no DB access, no logging, no side effects. Used by
 * transformers and business-layer code that needs derived batch state from
 * raw row data.
 */

'use strict';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Derives expiry-related metadata from a batch expiry date.
 *
 * Computes days-until-expiry using UTC-truncated dates, so daylight-saving
 * boundaries and timezone offsets do not skew the result. Returns a
 * fail-closed shape (`hasExpiryDate: false`, severity `'none'`) for null,
 * undefined, or malformed inputs — callers do not need to pre-validate.
 *
 * Severity bands:
 *   - `'expired'`  — daysUntilExpiry < 0
 *   - `'critical'` — 0–30 days remaining
 *   - `'warning'`  — 31 days through `nearExpiryDays` remaining
 *   - `'normal'`   — beyond `nearExpiryDays`
 *   - `'none'`     — no valid expiry date
 *
 * @param {string|Date|null|undefined} expiryDate     - Date string, Date instance, or nullish.
 * @param {number}                     [nearExpiryDays=90] - Threshold for the `warning` band.
 *
 * @returns {{
 *   hasExpiryDate:    boolean,
 *   daysUntilExpiry?: number,
 *   isExpired:        boolean,
 *   isNearExpiry:     boolean,
 *   expirySeverity:   'expired' | 'critical' | 'warning' | 'normal' | 'none'
 * }}
 */
const getExpiryMeta = (expiryDate, nearExpiryDays = 90) => {
  if (!expiryDate) {
    return {
      hasExpiryDate: false,
      isExpired: false,
      isNearExpiry: false,
      expirySeverity: 'none',
    };
  }
  
  const expiry = new Date(expiryDate);
  
  // Malformed input — fail closed rather than propagating NaN.
  if (Number.isNaN(expiry.getTime())) {
    return {
      hasExpiryDate: false,
      isExpired: false,
      isNearExpiry: false,
      expirySeverity: 'none',
    };
  }
  
  const today = new Date();
  
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  
  const expiryUtc = Date.UTC(
    expiry.getUTCFullYear(),
    expiry.getUTCMonth(),
    expiry.getUTCDate()
  );
  
  const daysUntilExpiry = Math.round((expiryUtc - todayUtc) / MS_PER_DAY);
  
  return {
    hasExpiryDate: true,
    daysUntilExpiry,
    isExpired: daysUntilExpiry < 0,
    isNearExpiry: daysUntilExpiry >= 0 && daysUntilExpiry <= nearExpiryDays,
    expirySeverity:
      daysUntilExpiry < 0
        ? 'expired'
        : daysUntilExpiry <= 30
          ? 'critical'
          : daysUntilExpiry <= nearExpiryDays
            ? 'warning'
            : 'normal',
  };
};

module.exports = {
  getExpiryMeta,
};
