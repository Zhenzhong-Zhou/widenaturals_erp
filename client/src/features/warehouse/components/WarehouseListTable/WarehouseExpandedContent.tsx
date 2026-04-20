import { type FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDateTime } from '@utils/dateTimeUtils';
import type { WarehouseRecord } from '@features/warehouse/state/warehouseTypes';
import { formatLabel } from '@utils/textUtils';

interface WarehouseExpandedContentProps {
  row: WarehouseRecord;
}

const WarehouseExpandedContent: FC<WarehouseExpandedContentProps> = ({ row }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Warehouse Details
      </CustomTypography>
      
      <DetailsSection
        sectionTitle="Configuration"
        fields={[
          { label: 'Default Fee',       value: row.defaultFee != null ? `$${row.defaultFee}` : null },
          { label: 'Code',  value: row.code ?? null },
        ]}
      />
      
      <DetailsSection
        sectionTitle="Audit"
        fields={[
          { label: 'Created By', value: row.audit.createdBy?.name, format: formatLabel },
          { label: 'Created At', value: row.audit.createdAt, format: formatDateTime },
          { label: 'Updated By', value: row.audit.updatedBy?.name, format: formatLabel },
          { label: 'Updated At', value: row.audit.updatedAt, format: formatDateTime },
        ]}
      />
    </Box>
  );
};

export default WarehouseExpandedContent;
