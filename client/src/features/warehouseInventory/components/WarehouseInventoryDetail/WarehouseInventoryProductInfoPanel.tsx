import { type FC } from 'react';
import { Card, Divider, Stack } from '@mui/material';
import { CustomTypography } from '@components/index';
import DetailField from './DetailField';
import type { ProductInfoDetail } from '@features/warehouseInventory';
import { formatDate } from '@utils/dateTimeUtils';

type WarehouseInventoryProductInfoPanelProps = {
  info: ProductInfoDetail | null;
};

const WarehouseInventoryProductInfoPanel: FC<
  WarehouseInventoryProductInfoPanelProps
> = ({ info }) => {
  if (!info) {
    return (
      <Card sx={{ p: 3, borderRadius: 2 }}>
        <CustomTypography variant="subtitle1" fontWeight={600} mb={1}>
          Product
        </CustomTypography>
        <CustomTypography variant="body2" color="text.secondary">
          No product information available.
        </CustomTypography>
      </Card>
    );
  }
  
  return (
    <Card sx={{ p: 3, borderRadius: 2 }}>
      <CustomTypography variant="subtitle1" fontWeight={600} mb={1.5}>
        Product
      </CustomTypography>
      <Stack spacing={1}>
        <DetailField label="Display name" value={info.product.displayName} />
        <DetailField label="Brand" value={info.product.brand} />
      </Stack>
      
      <Divider sx={{ my: 2 }} />
      
      <CustomTypography variant="subtitle2" fontWeight={600} mb={1}>
        SKU
      </CustomTypography>
      <Stack spacing={1}>
        <DetailField label="SKU code" value={info.sku.sku} />
        <DetailField label="Barcode" value={info.sku.barcode} />
        <DetailField label="Size" value={info.sku.sizeLabel} />
        <DetailField label="Country" value={info.sku.countryCode} />
        <DetailField label="Market region" value={info.sku.marketRegion} />
      </Stack>
      
      <Divider sx={{ my: 2 }} />
      
      <CustomTypography variant="subtitle2" fontWeight={600} mb={1}>
        Batch
      </CustomTypography>
      <Stack spacing={1}>
        <DetailField label="Lot number" value={info.batch.lotNumber} />
        <DetailField
          label="Expiry date"
          value={formatDate(info.batch.expiryDate)}
        />
      </Stack>
      
      <Divider sx={{ my: 2 }} />
      
      <CustomTypography variant="subtitle2" fontWeight={600} mb={1}>
        Manufacturer
      </CustomTypography>
      <Stack spacing={1}>
        <DetailField label="Name" value={info.manufacturer.name} />
      </Stack>
    </Card>
  );
};

export default WarehouseInventoryProductInfoPanel;
