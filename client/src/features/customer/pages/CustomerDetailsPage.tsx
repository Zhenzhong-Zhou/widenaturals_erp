import { type FC } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';

const CustomerDetailsPage: FC = () => {
  const { customerId } = useParams<{ customerId: string }>();

  return (
    <Box sx={{ display: 'flex', gap: 4, p: 3, flexWrap: 'wrap' }}>
      <CustomTypography>{customerId}</CustomTypography>
    </Box>
  );
};

export default CustomerDetailsPage;
