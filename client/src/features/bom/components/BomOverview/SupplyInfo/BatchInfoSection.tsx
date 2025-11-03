import type { FC } from 'react';
import type { FlattenedBomSupplyRow } from '@features/bom/state';
import DetailsSection from '@components/common/DetailsSection';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime, formatToISODate } from '@utils/dateTimeUtils';

const BatchInfoSection: FC<{ row: FlattenedBomSupplyRow }> = ({ row }) => (
  <DetailsSection
    sectionTitle="Batch Information"
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      bgcolor: 'background.paper',
      p: 1.5,
    }}
    fields={[
      { label: 'Unit', value: row.batchUnit },
      { label: 'Batch Currency', value: row.batchCurrency },
      { label: 'Batch Exchange Rate', value: row.batchExchangeRate },
      {
        label: 'Manufacture Date',
        value: row.manufactureDate,
        format: formatToISODate,
      },
      {
        label: 'Batch Status',
        value: row.batchStatusName,
        format: formatLabel,
      },
      {
        label: 'Batch Status Date',
        value: row.batchStatusDate,
        format: formatDateTime,
      },
      {
        label: 'Batch Created At',
        value: row.batchCreatedAt,
        format: formatDateTime,
      },
      {
        label: 'Batch Created By',
        value: row.batchCreatedBy,
        format: formatLabel,
      },
      {
        label: 'Batch Updated At',
        value: row.batchUpdatedAt,
        format: formatDateTime,
      },
      {
        label: 'Batch Updated By',
        value: row.batchUpdatedBy,
        format: formatLabel,
      },
    ]}
  />
);

export default BatchInfoSection;
