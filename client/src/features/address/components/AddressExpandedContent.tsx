import { type FC } from 'react';
import type { AddressListItem } from '@features/address/state/addressTypes';
import { Box, Grid } from '@mui/material';
import { CustomTypography } from '@components/index';

interface AddressExpandedContentProps {
  row: AddressListItem;
}

const AddressExpandedContent: FC<AddressExpandedContentProps> = ({ row }) => {
  const fields = [
    { label: 'Customer Email', value: row.customerEmail },
    { label: 'Recipient Email', value: row.email },
    { label: 'Recipient Phone', value: row.phone },
    { label: 'Full Address', value: row.displayAddress },
    { label: 'Address Line 1', value: row.address.line1 },
    { label: 'Address Line 2', value: row.address.line2 },
    { label: 'Postal Code', value: row.address.postalCode },
    { label: 'Region', value: row.address.region },
    { label: 'Created By', value: row.createdBy },
    { label: 'Updated By', value: row.updatedBy },
  ];

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
        Address Details
      </CustomTypography>

      <Grid container spacing={2}>
        {fields.map(({ label, value }, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6 }}>
            <Box>
              <CustomTypography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary'
              }}
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

export default AddressExpandedContent;
