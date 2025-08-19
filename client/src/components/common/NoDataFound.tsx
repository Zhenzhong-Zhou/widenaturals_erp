import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import GoBackButton from '@components/common/GoBackButton';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface NoDataFoundProps {
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

const NoDataFound: FC<NoDataFoundProps> = ({
                                             message = 'No records found.',
                                             icon = <HelpOutlineIcon fontSize="large" color="disabled" />,
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
