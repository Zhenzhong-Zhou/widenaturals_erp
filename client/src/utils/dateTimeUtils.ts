import { AppError, ErrorType } from '@utils/AppError.tsx';

/**
 * Helper function to validate a date object.
 * @param date - The date object to validate.
 * @throws {AppError} If the date is invalid.
 */
const validateDate = (date: Date): void => {
  if (isNaN(date.getTime())) {
    throw new AppError('Invalid timestamp provided', 400, {
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
  
  return { date: new Date(year, month, day, hour, minute, second), timezoneAbbreviation };
};

/**
 * Format date as YYYY-MM-DD.
 */
export const formatDate = (
  timestamp: string | number | Date,
  timezone: string = 'America/Vancouver'
): string => {
  const { date } = convertToLocalTime(timestamp, timezone);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format time as HH:mm:ss with timezone abbreviation.
 */
export const formatTime = (
  timestamp: string | number | Date,
  timezone: string = 'America/Vancouver'
): string => {
  const { date, timezoneAbbreviation } = convertToLocalTime(timestamp, timezone);
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${hour}:${minute}:${second} ${timezoneAbbreviation}`;
};

/**
 * Format date and time as YYYY-MM-DD HH:mm:ss with timezone abbreviation.
 */
export const formatDateTime = (
  timestamp: string | number | Date,
  timezone: string = 'America/Vancouver'
): string => {
  const { date, timezoneAbbreviation } = convertToLocalTime(timestamp, timezone);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second} ${timezoneAbbreviation}`;
};
