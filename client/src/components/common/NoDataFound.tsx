import type { FC, ReactNode } from 'react';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import { Box } from '@mui/material';
import {
  CustomTypography,
  GoBackButton
} from '@components/index';

interface NoDataFoundProps {
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

const NoDataFound: FC<NoDataFoundProps> = ({
  message = 'No records found.',
  icon = <HelpOutlinedIcon fontSize="large" color="disabled" />,
  action = <GoBackButton sx={{ mt: 1, minWidth: 160 }} />,
}) => {
  return (
    <Box
      sx={{
        mt: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
      role="status"
      aria-live="polite"
    >
      {icon && <Box sx={{ mb: 2 }}>{icon}</Box>}

      <CustomTypography
        variant="h5"
        color="text.secondary"
        sx={{ fontWeight: 600, mb: 2 }}
      >
        {message}
      </CustomTypography>

      {action}
    </Box>
  );
};

export default NoDataFound;
