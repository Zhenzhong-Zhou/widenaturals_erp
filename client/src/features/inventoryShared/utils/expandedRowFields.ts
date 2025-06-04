import type { DetailsSectionField } from '@components/common/DetailsSection';
import type { WarehouseInventoryRecord } from '@features/warehouseInventory/state';
import type { LocationInventoryRecord } from '@features/locationInventory/state';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

export function getInventoryDetailsFields(
  record: WarehouseInventoryRecord | LocationInventoryRecord
): {
  details: DetailsSectionField[];
  metadata: DetailsSectionField[];
} {
  const isWarehouseRecord = 'warehouse' in record;
  const isLocationRecord = 'location' in record;

  const details: DetailsSectionField[] = [
    { label: 'Item Type', value: record.itemType, format: formatLabel },
    ...(isWarehouseRecord
      ? [{ label: 'Warehouse Name', value: record.warehouse.name }]
      : isLocationRecord
        ? [
            { label: 'Location Name', value: record.location.name },
            { label: 'Location Type', value: record.location.type },
          ]
        : []),
    { label: 'Lot Number', value: record.lot?.number },
    {
      label: 'Manufacture Date',
      value: record.lot?.manufactureDate,
      format: formatDate,
    },
    { label: 'Expiry Date', value: record.lot?.expiryDate, format: formatDate },
    { label: 'Manufacturer', value: record.product?.manufacturer },

    { label: 'Product Name', value: record.product?.name },
    { label: 'Brand', value: record.product?.brand },
    { label: 'SKU', value: record.product?.sku },
    { label: 'Barcode', value: record.product?.barcode },
    { label: 'Language', value: record.product?.language },
    { label: 'Country Code', value: record.product?.countryCode },
    { label: 'Size Label', value: record.product?.sizeLabel },

    { label: 'Material Name', value: record.material?.name },
    { label: 'Received Name', value: record.material?.receivedName },
    { label: 'Material Code', value: record.material?.code },
    { label: 'Material Unit', value: record.material?.unit },
    { label: 'Supplier', value: record.material?.supplier },

    { label: 'Part Name', value: record.part?.name },
    { label: 'Part Code', value: record.part?.code },
    { label: 'Part Type', value: record.part?.type, format: formatLabel },
    { label: 'Part Unit', value: record.part?.unit, format: formatLabel },
  ];

  const metadata: DetailsSectionField[] = [
    { label: 'Created By', value: record.createdBy },
    { label: 'Updated By', value: record.updatedBy },
    {
      label: 'Created At',
      value: record.timestamps?.createdAt,
      format: formatDate,
    },
    {
      label: 'Updated At',
      value: record.timestamps?.updatedAt,
      format: formatDate,
    },
    {
      label: 'Inbound Date',
      value: record.timestamps?.inboundDate,
      format: formatDateTime,
    },
    {
      label: 'Outbound Date',
      value: record.timestamps?.outboundDate,
      format: formatDateTime,
    },
    {
      label: 'Last Update',
      value: record.timestamps?.lastUpdate,
      format: formatDate,
    },
  ];

  return { details, metadata };
}
