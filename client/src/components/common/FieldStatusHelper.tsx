import type { FC, ReactNode } from 'react';
import CustomTypography from '@components/common/CustomTypography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export type FieldStatus = 'required' | 'invalid' | 'valid' | 'none';

interface FieldStatusHelperProps {
  status?: FieldStatus; // 'required', 'invalid', 'valid', 'none'
  message?: string; // override default message
  children?: ReactNode; // if you want to completely override content
}

const defaultMessages: Record<FieldStatus, string> = {
  required: 'Required',
  invalid: 'Please check the format',
  valid: 'Looks good',
  none: '',
};

const FieldStatusHelper: FC<FieldStatusHelperProps> = ({
  status = 'none',
  message,
  children,
}) => {
  if (status === 'none') return null;

  let icon: ReactNode;
  let color: 'error' | 'warning.main' | 'success.main';

  switch (status) {
    case 'required':
      icon = <ErrorOutlineIcon fontSize="small" />;
      color = 'error';
      break;
    case 'invalid':
      icon = <WarningAmberIcon fontSize="small" />;
      color = 'warning.main';
      break;
    case 'valid':
      icon = <CheckCircleIcon fontSize="small" />;
      color = 'success.main';
      break;
    default:
      return null;
  }

  return (
    <CustomTypography
      component="span"
      variant="caption"
      color={color}
      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
    >
      {icon}
      {children ?? message ?? defaultMessages[status]}
    </CustomTypography>
  );
};

export default FieldStatusHelper;
