import { type FC } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import DetailsSection, { type DetailsSectionField } from '@components/common/DetailsSection';
import type { LocationInventoryRecord } from '../state';
import { formatLabel } from '@utils/textUtils.ts';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils.ts';

interface Props {
  record: LocationInventoryRecord;
}

const LocationInventoryExpandedRow: FC<Props> = ({ record }) => {
  const details: DetailsSectionField[] = [
    { label: 'Item Type', value: record.itemType, format: (val) => formatLabel(val) },
    { label: 'Location Name', value: record.location?.name },
    { label: 'Location Type', value: record.location?.type },
    
    { label: 'Lot Number', value: record.lot?.number },
    { label: 'Manufacture Date', value: record.lot?.manufactureDate, format: (val) => formatDate(val) },
    { label: 'Expiry Date', value: record.lot?.expiryDate, format: (val) => formatDate(val) },
    { label: 'Manufacturer', value: record.product?.manufacturer },
    
    // Product
    { label: 'Product Name', value: record.product?.name },
    { label: 'Brand', value: record.product?.brand },
    { label: 'SKU', value: record.product?.sku },
    { label: 'Barcode', value: record.product?.barcode },
    { label: 'Language', value: record.product?.language },
    { label: 'Country Code', value: record.product?.countryCode },
    { label: 'Size Label', value: record.product?.sizeLabel },
    
    // Material (optional)
    { label: 'Material Name', value: record.material?.name },
    { label: 'Received Name', value: record.material?.received_name },
    { label: 'Material Code', value: record.material?.code },
    { label: 'Material Unit', value: record.material?.unit },
    { label: 'Supplier', value: record.material?.supplier },
    
    // Part (optional)
    { label: 'Part Name', value: record.part?.name },
    { label: 'Part Code', value: record.part?.code },
    { label: 'Part Type', value: record.part?.type, format: (val) => formatLabel(val) },
    { label: 'Part Unit', value: record.part?.unit, format: (val) => formatLabel(val) },
  ];
  
  const metadata: DetailsSectionField[] = [
    { label: 'Created By', value: record.createdBy },
    { label: 'Updated By', value: record.updatedBy },
    { label: 'Created At', value: record.timestamps?.createdAt, format: (val) => formatDate(val) },
    { label: 'Updated At', value: record.timestamps?.updatedAt, format: (val) => formatDate(val) },
    { label: 'Inbound Date', value: record.timestamps?.inboundDate, format: (val) => formatDateTime(val) },
    { label: 'Outbound Date', value: record.timestamps?.outboundDate },
    { label: 'Last Update', value: record.timestamps?.lastUpdate },
  ];
  
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

export default LocationInventoryExpandedRow;
