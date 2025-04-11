import type { FC } from 'react';
import Chip from '@mui/material/Chip';
import { formatLabel } from '@utils/textUtils';
import { useThemeContext } from '@context/ThemeContext';

interface Props {
  severity: 'expired' | 'expired_soon' | 'critical' | 'warning' | 'notice' | 'safe' | 'unknown';
}

const ExpirySeverityChip: FC<Props> = ({ severity }) => {
  const { theme } = useThemeContext();
  
  const colorMap: Record<Props['severity'], string> = {
    expired: theme.palette.error.main,
    expired_soon: theme.palette.error.light,
    critical: theme.palette.warning.dark,
    warning: theme.palette.warning.main,
    notice: theme.palette.info.main,
    safe: theme.palette.success.main,
    unknown: theme.palette.text.disabled,
  };
  
  return (
    <Chip
      label={formatLabel(severity.replace(/_/g, ' '))}
      size="small"
      variant="outlined"
      sx={{
        borderColor: colorMap[severity],
        color: colorMap[severity],
        fontWeight: 500,
        textTransform: 'capitalize',
      }}
    />
  );
};

export default ExpirySeverityChip;
