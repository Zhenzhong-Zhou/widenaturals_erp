import { FC } from 'react';
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
    <Box sx={{ textAlign: 'center', mt: 5 }}>
      <CustomTypography variant="h5" color="error">
        {message}
      </CustomTypography>
      <GoBackButton />
    </Box>
  );
};

export default NoDataFound;
