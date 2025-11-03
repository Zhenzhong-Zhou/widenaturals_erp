import type { FC } from 'react';
import type { FlattenedBomReadinessPartRow } from '@features/bom/state';
import DetailsSection from '@components/common/DetailsSection';

const BatchInventorySection: FC<{ row: FlattenedBomReadinessPartRow }> = ({
  row,
}) => (
  <DetailsSection
    sectionTitle="Batch Inventory"
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      bgcolor: 'background.paper',
      p: 1.5,
    }}
    fields={[
      { label: 'Warehouse', value: row.warehouseName ?? '—' },
      { label: 'Available Quantity', value: row.availableQuantity ?? '—' },
      { label: 'Reserved Quantity', value: row.reservedQuantity ?? '—' },
      { label: 'Max Producible Units', value: row?.maxProducibleUnits },
      { label: 'Required Qty / Unit', value: row.requiredQtyPerUnit ?? '—' },
      { label: 'Shortage Qty', value: row?.shortageQty },
      { label: 'Inventory Status', value: row.inventoryStatus },
      { label: 'Inbound Date', value: row.inboundDate },
      { label: 'Last Update', value: row.lastUpdate },
    ]}
  />
);

export default BatchInventorySection;
