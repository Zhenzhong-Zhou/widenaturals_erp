import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';
import type { CustomerListItem } from '@features/customer/state/customerTypes';
import { formatDateTime } from '@utils/dateTimeUtils';

interface CustomerExpandedContentProps {
  row: CustomerListItem;
}

const CustomerExpandedContent: FC<CustomerExpandedContentProps> = ({ row }) => {
  const fields = [
    { label: 'Created At', value: formatDateTime(row.createdAt) },
    { label: 'Created By', value: row.createdBy },
    { label: 'Updated At', value: formatDateTime(row.updatedAt) },
    { label: 'Updated By', value: row.updatedBy },
  ];
  
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" fontWeight={600} gutterBottom>
        Customer Details
      </CustomTypography>
      
      <Grid container spacing={2}>
        {fields.map(({ label, value }, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6 }}>
            <Box>
              <CustomTypography
                variant="body2"
                fontWeight={600}
                sx={{ color: 'text.primary' }}
              >
                {label}:
              </CustomTypography>
              <CustomTypography
                variant="body2"
                sx={{ color: 'text.secondary', wordBreak: 'break-word' }}
              >
                {value || '—'}
              </CustomTypography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CustomerExpandedContent;
