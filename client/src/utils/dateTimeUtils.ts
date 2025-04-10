import { AppError, ErrorType } from '@utils/AppError';
import { parse } from 'date-fns/parse';
import { parseISO } from 'date-fns/parseISO';
import { differenceInDays } from 'date-fns/differenceInDays';
import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { isValid } from 'date-fns/isValid';

/**
 * Validates a date input and ensures it matches a recognized format.
 *
 * - Supports common date formats: `YYYY-MM-DD`, `MM/DD/YYYY`, `YYYY.MM.DD`, `DD.MM.YYYY`, `YYYY/MM/DD`, `MM-DD-YYYY`.
 * - Throws an `AppError` if the input is invalid when `isFinalValidation` is `true`.
 * - Returns `true` for valid dates and `false` for partial or incomplete inputs.
 *
 * @param {string | Date} input - The date input to validate. Can be a string or a `Date` object.
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
  timestamp: string | number | Date | null,
  timezone: string = 'America/Vancouver'
): string => {
  if (!timestamp) return 'N/A';

  const localTime = convertToLocalTime(timestamp, timezone);
  if (!localTime || !localTime.date || isNaN(localTime.date.getTime())) {
    return 'N/A'; // Ensure valid date
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
  timezone: string = 'America/Vancouver'
): string => {
  if (!timestamp) return 'N/A'; // Handle null or undefined inputs gracefully

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date'; // Handle invalid date values

  const { date: localDate, timezoneAbbreviation } = convertToLocalTime(
    date,
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
 * Returns relative time (e.g., "2 days ago", "10 minutes ago")
 */
export const timeAgo = (date: Date | string): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const diffMinutes = differenceInMinutes(new Date(), parsedDate);

  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  const diffDays = differenceInDays(new Date(), parsedDate);
  return diffDays === 0 ? 'Today' : `${diffDays} days ago`;
};

/**
 * Converts a date input to YYYY-MM-DD format.
 */
export const formatToISODate = (dateInput: any): string => {
  if (!dateInput) return 'N/A'; // Handle null, undefined, empty

  // Convert string timestamps to Date objects
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'N/A'; // Ensure valid date
  }

  return date.toISOString().split('T')[0]; // Extract YYYY-MM-DD
};
