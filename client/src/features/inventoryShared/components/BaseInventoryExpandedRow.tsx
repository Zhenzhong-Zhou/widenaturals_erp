import { type FC } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import DetailsSection, { type DetailsSectionField } from '@components/common/DetailsSection';

interface BaseInventoryExpandedRowProps {
  details: DetailsSectionField[];
  metadata: DetailsSectionField[];
}

const BaseInventoryExpandedRow: FC<BaseInventoryExpandedRowProps> = ({ details, metadata }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={3}
      sx={(theme) => ({
        p: 5,
        backgroundColor: theme.palette.action.hover,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        mx: 1,
      })}
    >
      <DetailsSection fields={details} sectionTitle="Details" />
      <Divider sx={{ my: 1 }} />
      <DetailsSection fields={metadata} sectionTitle="Metadata" />
    </Box>
  );
};

export default BaseInventoryExpandedRow;
