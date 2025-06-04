import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import GoBackButton from '@components/common/GoBackButton';

interface NoDataFoundProps {
  message?: string;
}

const NoDataFound: FC<NoDataFoundProps> = ({
  message = 'No records found.',
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
      <CustomTypography
        variant="h5"
        color="text.secondary"
        sx={{ fontWeight: 600, mb: 2 }}
      >
        {message}
      </CustomTypography>

      <GoBackButton
        sx={{
          mt: 1,
          minWidth: 160,
        }}
      />
    </Box>
  );
};

export default NoDataFound;
