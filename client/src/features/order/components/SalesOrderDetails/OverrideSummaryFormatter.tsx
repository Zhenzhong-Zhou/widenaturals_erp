import type { JSX } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import { formatDateTime } from '@utils/dateTimeUtils';

interface OverrideItem {
  sku_id?: string;
  sku?: string;
  productDisplayName?: string;
  db_price?: number;
  submitted_price?: number;
}

interface OverrideSummary {
  generated_at?: string | null;
  has_override?: boolean;
  override_count?: number;
  overrides?: OverrideItem[];
}

/**
 * Formatter for order_metadata.price_override_summary used in MemoizedDetailsSection
 *
 * @param summary - The summary object to render
 * @returns JSX.Element | string
 */
const OverrideSummaryFormatter = (
  summary: OverrideSummary | null | undefined
): JSX.Element | string => {
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

export default OverrideSummaryFormatter;
