import Stack from '@mui/material/Stack';
import { CustomTypography } from '@components/index';

interface Props {
  total: number;
  confirmed: number;
  incomplete: number;
}

const AllocationStatusSummary = ({ total, confirmed, incomplete }: Props) => {
  return (
    <Stack
      direction="row"
      spacing={3}
      alignItems="center"
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor: 'grey.100',
      }}
    >
      <CustomTypography variant="body2" sx={{ fontWeight: 600 }}>
        Allocation Status
      </CustomTypography>

      <CustomTypography variant="body2">Total Items: {total}</CustomTypography>

      <CustomTypography variant="body2" color="success.main">
        Fully Allocated: {confirmed}
      </CustomTypography>

      <CustomTypography
        variant="body2"
        color={incomplete > 0 ? 'error.main' : 'success.main'}
      >
        Pending Allocation: {incomplete}
      </CustomTypography>
    </Stack>
  );
};

export default AllocationStatusSummary;
