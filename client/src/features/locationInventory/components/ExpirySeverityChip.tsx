import { memo, type FC } from 'react';
import Chip from '@mui/material/Chip';
import { formatLabel } from '@utils/textUtils';
import { useThemeContext } from '@context/ThemeContext';
import type { Theme } from '@mui/material';

interface Props {
  severity:
    | 'expired'
    | 'expired_soon'
    | 'critical'
    | 'warning'
    | 'notice'
    | 'safe'
    | 'unknown';
}

// Optional: move outside component to prevent recreation on render
const getSeverityColor = (severity: Props['severity'], theme: Theme): string => {
  const map: Record<Props['severity'], string> = {
    expired: theme.palette.error.main,
    expired_soon: theme.palette.error.light,
    critical: theme.palette.warning.dark,
    warning: theme.palette.warning.main,
    notice: theme.palette.info.main,
    safe: theme.palette.success.main,
    unknown: theme.palette.text.disabled,
  };
  return map[severity];
};

const ExpirySeverityChip: FC<Props> = ({ severity }) => {
  const { theme } = useThemeContext(); // more idiomatic than custom context if only palette is used
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
