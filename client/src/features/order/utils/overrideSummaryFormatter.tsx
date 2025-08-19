import type { JSX } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import { formatDateTime } from '@utils/dateTimeUtils';

/**
 * Formatter for order_metadata.price_override_summary used in MemoizedDetailsSection
 *
 * @param summary - The summary object to render
 * @returns JSX.Element | string
 */
export const overrideSummaryFormatter = (summary: any): JSX.Element | string => {
  if (!summary) return '—';
  
  const {
    generated_at,
    has_override,
    override_count,
    overrides,
  } = summary;
  
  return (
    <Box>
      <CustomTypography component="div">
        Generated At: {formatDateTime(generated_at) ?? '—'}
      </CustomTypography>
      <CustomTypography component="div">
        Has Override: {has_override ? 'Yes' : 'No'}
      </CustomTypography>
      <CustomTypography component="div">
        Override Count: {override_count ?? 0}
      </CustomTypography>
      
      {Array.isArray(overrides) && overrides.length > 0 ? (
        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
          {overrides.map((item, i) => (
            <li key={item.sku_id ?? i}>
              <strong>SKU:</strong> {item.productDisplayName} ({item.sku}) —{' '}
              <strong>DB:</strong> ${item.db_price} →{' '}
              <strong>Submitted:</strong> ${item.submitted_price}
            </li>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            mt: 1,
            fontStyle: 'italic',
            color: 'text.secondary',
          }}
        >
          No specific override records.
        </Box>
      )}
    </Box>
  );
};
