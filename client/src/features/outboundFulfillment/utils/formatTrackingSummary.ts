import { FlattenedTrackingRow } from '@features/outboundFulfillment';

/**
 * Compact tracking summary for the header section.
 * Shows primary tracking + carrier with "+N more" when multiple are attached.
 *
 * For the full list, render a dedicated TrackingNumbersSection below the header.
 */
export const formatTrackingSummary = (
  trackingNumbers: FlattenedTrackingRow[]
): string => {
  if (!trackingNumbers.length) return '—';
  
  const primary = trackingNumbers[0];
  if (!primary) return '—';
  
  const identifier =
    primary.trackingNumber ?? primary.bolNumber ?? '—';
  const carrierPart = primary.carrier ? ` (${primary.carrier})` : '';
  const morePart =
    trackingNumbers.length > 1
      ? ` +${trackingNumbers.length - 1} more`
      : '';
  
  return `${identifier}${carrierPart}${morePart}`;
};
