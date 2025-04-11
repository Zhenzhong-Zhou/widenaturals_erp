import type { FC } from 'react';
import Box from '@mui/material/Box';
import { useThemeContext } from '@context/ThemeContext';
import GoBackButton from '@components/common/GoBackButton';
import CustomTypography from '@components/common/CustomTypography';

interface CustomerDetailHeaderProps {
  customerName: string;
}

const CustomerDetailHeader: FC<CustomerDetailHeaderProps> = ({
  customerName,
}) => {
  const { theme } = useThemeContext();

  return (
    <Box sx={{ textAlign: 'center', marginBottom: theme.spacing(3) }}>
      <GoBackButton />
      {/* Customer Name */}
      <CustomTypography
        variant="h6"
        sx={{
          marginTop: theme.spacing(2),
          color: theme.palette.text.primary,
        }}
      >
        Customer Name: {customerName} Info
      </CustomTypography>
    </Box>
  );
};

export default CustomerDetailHeader;
