import { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@components/common/Typography';
import GoBackButton from '@components/common/GoBackButton';

interface NoDataFoundProps {
  message?: string;
}

const NoDataFound: FC<NoDataFoundProps> = ({
  message = 'No records found.',
}) => {
  return (
    <Box sx={{ textAlign: 'center', mt: 5 }}>
      <Typography variant="h5" color="error">
        {message}
      </Typography>
      <GoBackButton />
    </Box>
  );
};

export default NoDataFound;
