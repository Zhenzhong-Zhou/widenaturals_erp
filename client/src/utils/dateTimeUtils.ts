import { AppError, ErrorType } from '@utils/AppError';
import { parse } from 'date-fns/parse';
import { parseISO } from 'date-fns/parseISO';
import { differenceInDays } from 'date-fns/differenceInDays';
import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { isValid } from 'date-fns/isValid';
import {
  addDays,
  differenceInHours,
  differenceInMonths,
  differenceInSeconds,
  startOfDay,
} from 'date-fns';

/**
 * Validates a date input and ensures it matches a recognized format.
 *
 * - Supports common date formats: `YYYY-MM-DD`, `MM/DD/YYYY`, `YYYY.MM.DD`, `DD.MM.YYYY`, `YYYY/MM/DD`, `MM-DD-YYYY`.
 * - Throws an `AppError` if the input is invalid when `isFinalValidation` is `true`.
 * - Returns `true` for valid dates and `false` for partial or incomplete inputs.
 *
 * @param {string | Date} input - The date input to validate. It Can be a string or a `Date` object.
 * @throws {AppError} If `isFinalValidation` is `true` and the date is invalid.
 * @returns {boolean} - `true` if the date is valid, `false` if the input is incomplete or still being typed.
 */
const validateDate = (input: string | Date): void => {
  if (!input) {
    throw new AppError('Invalid timestamp provided: Empty value', 400, {
      type: ErrorType.ValidationError,
    });
  }

  let date: Date | null = null;

  if (input instanceof Date) {
    date = input;
  } else {
    {
      // Trim whitespace to avoid issues with extra spaces
      {
        const trimmedInput = input.trim();
        {
          if (trimmedInput === '') {
            throw new AppError(
              'Invalid timestamp provided: Empty string',
              400,
              {
                type: ErrorType.ValidationError,
              }
            );
          }
          {
            const formats = [
              'yyyy-MM-dd',
              'MM/dd/yyyy',
              'yyyy.MM.dd',
              'dd.MM.yyyy',
              'yyyy/MM/dd',
              'MM-dd-yyyy',
            ];
            for (const format of formats) {
              const parsedDate = parse(trimmedInput, format, new Date());

              // Ensure the parsed date is actually valid
              if (isValid(parsedDate) && !isNaN(parsedDate.getTime())) {
                date = parsedDate;
                break;
              }
            }
          }
        }
      }
    }
  }

  // Final validation check
  if (!date || isNaN(date.getTime())) {
    throw new AppError(`Invalid timestamp provided: ${input}`, 400, {
      type: ErrorType.ValidationError,
    });
  }
};

/**
 * Convert a UTC timestamp to local time in a specified timezone.
 * @param timestamp - The UTC timestamp (ISO string, number, or Date object).
 * @param timezone - The target timezone (default: user's local timezone).
 * @returns A Date object in the target timezone.
 */
const convertToLocalTime = (
  timestamp: string | number | Date,
  timezone: string = 'America/Vancouver'
): { date: Date; timezoneAbbreviation: string } => {
  const date = new Date(timestamp);
  validateDate(date);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value) - 1; // Months are 0-based
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value);
  const second = Number(parts.find((p) => p.type === 'second')?.value);

  // Determine the timezone abbreviation (PST or PDT)
  const isDST = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value;

  const timezoneAbbreviation = isDST || 'PST';

  return {
    date: new Date(year, month, day, hour, minute, second),
    timezoneAbbreviation,
  };
};

/**
 * Format date as YYYY-MM-DD.
 */
export const formatDate = (
  timestamp: string | number | Date | null | undefined,
  timezone: string = 'America/Vancouver',
  fallback: string = '-'
): string => {
  if (
    timestamp === null ||
    timestamp === undefined ||
    timestamp === '' ||
    timestamp === '-' ||
    timestamp === 'N/A'
  ) {
    return fallback;
  }
  
  const localTime = convertToLocalTime(timestamp, timezone);
  if (!localTime || !localTime.date || isNaN(localTime.date.getTime())) {
    return fallback; // invalid date → fallback
  }
  
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).format(localTime.date);
};

/**
 * Format time as HH:mm:ss with timezone abbreviation.
 */
export const formatTime = (
  timestamp: string | number | Date,
  timezone: string = 'America/Vancouver'
): string => {
  const { date, timezoneAbbreviation } = convertToLocalTime(
    timestamp,
    timezone
  );
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${hour}:${minute}:${second} ${timezoneAbbreviation}`;
};

/**
 * Format date and time as YYYY-MM-DD HH:mm:ss with timezone abbreviation.
 */
export const formatDateTime = (
  timestamp: string | number | Date | null | undefined,
  timezone: string = 'America/Vancouver',
  fallback: string = '-'
): string => {
  if (
    timestamp === null ||
    timestamp === undefined ||
    timestamp === '' ||
    timestamp === '-' ||
    timestamp === 'N/A'
  ) {
    return fallback;
  }

  const rawDate =
    typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
  if (!isValid(rawDate)) return 'N/A';

  const { date: localDate, timezoneAbbreviation } = convertToLocalTime(
    rawDate,
    timezone
  );

  // Format with zero-padded values for consistency
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hour = String(localDate.getHours()).padStart(2, '0');
  const minute = String(localDate.getMinutes()).padStart(2, '0');
  const second = String(localDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second} ${timezoneAbbreviation}`;
};

/**
 * Returned a human-readable "time ago" string for a given date.
 *
 * @param {Date | string} date - The input date (can be an ISO string or Date object)
 * @returns {string} A relative time description (e.g., "5 minutes ago", "2 days ago")
 */
export const timeAgo = (date: Date | string): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();

  const diffSeconds = differenceInSeconds(now, parsedDate);
  if (diffSeconds < 60)
    return `${diffSeconds} second${diffSeconds === 1 ? '' : 's'} ago`;

  const diffMinutes = differenceInMinutes(now, parsedDate);
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = differenceInHours(now, parsedDate);
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = differenceInDays(now, parsedDate);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const diffMonths = differenceInMonths(now, parsedDate);
  return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
};

/**
 * Converts a date input to YYYY-MM-DD format.
 */
export const formatToISODate = (
  dateInput: string | Date | null | undefined
): string => {
  if (!dateInput) return 'N/A'; // Handle null, undefined, empty

  // Convert string timestamps to Date objects
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) return 'N/A';

  const isoString = date.toISOString();
  const parts = isoString.split('T');

  return parts[0] ?? 'N/A'; // Extract YYYY-MM-DD
};

/**
 * Adjusts a "before" date to make filtering inclusive:
 * Adds 1 day and sets time to start of day (00:00),
 * so dates like '2025-07-08' include the full day in filtering.
 *
 * @param input - Date string (e.g., '2025-07-08') or undefined
 * @returns ISO string for start of the next day (e.g., '2025-07-09T00:00:00.000Z'), or '' if invalid
 */
export const adjustBeforeDateInclusive = (input?: string): string => {
  const date = input ? new Date(input) : null;
  return date && isValid(date)
    ? startOfDay(addDays(date, 1)).toISOString()
    : '';
};

/**
 * Adjusts a date string to the start of that day (00:00:00)
 * and returns it as a full ISO 8601 timestamp.
 *
 * Typically used for `>=` filters in SQL queries to include
 * all events on the selected "after" date.
 *
 * Example:
 *   Input: '2025-09-04' → Output: '2025-09-04T00:00:00.000Z'
 *
 * @param input - A date string in 'YYYY-MM-DD' or ISO format
 * @returns ISO 8601 timestamp string starting at 00:00:00 of the given day,
 *          or an empty string if the input is invalid.
 */
export const adjustAfterDate = (input?: string): string => {
  const date = input ? new Date(input) : null;
  return date && isValid(date)
    ? startOfDay(date).toISOString()
    : '';
};

/**
 * Safely converts a date-like input to an ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`).
 *
 * Accepts a `Date` object or a valid date string and returns its ISO string representation.
 * Returns `undefined` if the input is invalid, empty, or not parseable.
 *
 * This function is useful for transforming client-side date inputs
 * (e.g., from a date picker or filter form) into valid ISO strings for backend query parameters.
 *
 * @param value - The input value to convert (Date, ISO string, or null/undefined).
 * @returns A valid ISO 8601 string or `undefined` if the input is invalid.
 */
export const toISO = (
  value: string | Date | null | undefined
): string | undefined => {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    return !isNaN(parsed.getTime()) ? parsed.toISOString() : undefined;
  }
  return undefined;
};
