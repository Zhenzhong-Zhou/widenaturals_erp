/**
 * @file person-utils.js
 * @description
 * Person and contact formatting utilities.
 *
 * Provides helpers for constructing display strings from person
 * data fields such as names and contact details.
 */

'use strict';

/**
 * Constructs a full name from first and last name components.
 *
 * Handles null, undefined, and whitespace-only inputs gracefully.
 * Returns an em dash if both parts are absent.
 *
 * @param {string|null|undefined} first - First name
 * @param {string|null|undefined} last - Last name
 * @returns {string} Full name (e.g. 'Jane Doe'), or '—' if both are empty
 */
const getFullName = (first, last) => {
  const parts = [first, last]
    .map((s) => (s ? String(s).trim() : ''))
    .filter(Boolean);
  
  return parts.length > 0 ? parts.join(' ') : '—';
};

module.exports = {
  getFullName,
};
