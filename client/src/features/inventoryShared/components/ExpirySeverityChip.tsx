import { memo, type FC } from 'react';
import { useTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material';
import Chip from '@mui/material/Chip';
import { formatLabel } from '@utils/textUtils';

export interface ExpirySeverityChipProps {
  severity:
    | 'expired'
    | 'expired_soon'
    | 'critical'
    | 'warning'
    | 'notice'
    | 'safe'
    | 'normal'
    | 'unknown';
}

// Optional: move outside component to prevent recreation on render
const getSeverityColor = (
  severity: ExpirySeverityChipProps['severity'],
  theme: Theme
): string => {
  const map: Record<ExpirySeverityChipProps['severity'], string> = {
    expired: theme.palette.error.main,
    expired_soon: theme.palette.error.light,
    critical: theme.palette.warning.dark,
    warning: theme.palette.warning.main,
    notice: theme.palette.info.main,
    safe: theme.palette.success.main,
    normal: theme.palette.success.main,
    unknown: theme.palette.text.disabled,
  };
  return map[severity];
};

const ExpirySeverityChip: FC<ExpirySeverityChipProps> = ({ severity }) => {
  const theme = useTheme();
  const color = getSeverityColor(severity, theme);

  return (
    <Chip
      label={formatLabel(severity)} // already handles underscores/spaces
      size="small"
      variant="outlined"
      sx={{
        borderColor: color,
        color,
        fontWeight: 500,
        textTransform: 'capitalize',
      }}
    />
  );
};

export default memo(ExpirySeverityChip);
