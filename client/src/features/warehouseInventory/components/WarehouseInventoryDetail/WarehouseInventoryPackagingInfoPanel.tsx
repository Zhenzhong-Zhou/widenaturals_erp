import { type FC } from 'react';
import { Card, Divider, Stack } from '@mui/material';
import { CustomTypography } from '@components/index';
import { DetailField } from '@features/warehouseInventory/components/WarehouseInventoryDetail';
import { formatDate } from '@utils/dateTimeUtils';
import type { PackagingInfoDetail } from '@features/warehouseInventory';

type WarehouseInventoryPackagingInfoPanelProps = {
  info: PackagingInfoDetail | null;
};

const WarehouseInventoryPackagingInfoPanel: FC<
  WarehouseInventoryPackagingInfoPanelProps
> = ({ info }) => {
  if (!info) {
    return (
      <Card sx={{ p: 3, borderRadius: 2 }}>
        <CustomTypography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            mb: 1,
          }}
        >
          Packaging Material
        </CustomTypography>
        
        <CustomTypography variant="body2" color="text.secondary">
          No packaging information available.
        </CustomTypography>
      </Card>
    );
  }
  
  return (
    <Card sx={{ p: 3, borderRadius: 2 }}>
      <CustomTypography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          mb: 1.5,
        }}
      >
        Packaging Material
      </CustomTypography>
      
      <Stack spacing={1}>
        <DetailField label="Material code" value={info.material.code} />
      </Stack>
      
      <Divider sx={{ my: 2 }} />
      
      <CustomTypography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          mb: 1,
        }}
      >
        Batch
      </CustomTypography>
      
      <Stack spacing={1}>
        <DetailField label="Display name" value={info.batch.displayName} />
        <DetailField label="Lot number" value={info.batch.lotNumber} />
        <DetailField
          label="Expiry date"
          value={formatDate(info.batch.expiryDate)}
        />
      </Stack>
      
      <Divider sx={{ my: 2 }} />
      
      <CustomTypography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          mb: 1,
        }}
      >
        Supplier
      </CustomTypography>
      
      <Stack spacing={1}>
        <DetailField label="Name" value={info.supplier.name} />
      </Stack>
    </Card>
  );
};

export default WarehouseInventoryPackagingInfoPanel;
