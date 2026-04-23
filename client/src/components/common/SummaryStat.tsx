import type { FC } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import CustomTypography from '@components/common/CustomTypography';

export type SummaryStatAlign = 'left' | 'right' | 'center';

export interface SummaryStatProps {
  /** Label shown above the value (e.g. "Available", "Reserved"). */
  label: string;
  
  /** Numeric or pre-formatted value to display. Numbers are locale-formatted automatically. */
  value: number | string | null | undefined;
  
  /** Text alignment for label + value. Defaults to 'right'. */
  align?: SummaryStatAlign;
  
  /** Fallback shown when value is null/undefined. Defaults to '—'. */
  fallback?: string;
  
  /** Optional tooltip shown on hover for longer explanations. */
  tooltip?: string;
  
  /** Optional locale override for number formatting. Defaults to browser locale. */
  locale?: string | string[];
  
  /** Optional Intl.NumberFormat options for value formatting. */
  numberFormatOptions?: Intl.NumberFormatOptions;
}

/**
 * Compact label-over-value stat display.
 *
 * Use in page headers, dashboard cards, or summary rows where you want to
 * surface a single metric with a short descriptive label.
 *
 * @example
 *   <SummaryStat label="Available" value={3211} />
 *   <SummaryStat label="Revenue" value={12500} numberFormatOptions={{ style: 'currency', currency: 'USD' }} />
 *   <SummaryStat label="Status" value="Active" />
 */
const SummaryStat: FC<SummaryStatProps> = ({
                                             label,
                                             value,
                                             align = 'right',
                                             fallback = '—',
                                             tooltip,
                                             locale,
                                             numberFormatOptions,
                                           }) => {
  const displayValue = (() => {
    if (value == null) return fallback;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return fallback;
      return value.toLocaleString(locale, numberFormatOptions);
    }
    return value;
  })();
  
  const content = (
    <Box textAlign={align}>
      <CustomTypography variant="caption" color="text.secondary" display="block">
        {label}
      </CustomTypography>
      <CustomTypography variant="body1" fontWeight={600}>
        {displayValue}
      </CustomTypography>
    </Box>
  );
  
  return tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content;
};

export default SummaryStat;
