import type { FC } from 'react';
import type { FlattenedBomSupplyRow } from '@features/bom/state';
import DetailsSection from '@components/common/DetailsSection';

const PartMetadataSection: FC<{ row: FlattenedBomSupplyRow }> = ({ row }) => (
  <DetailsSection
    sectionTitle="Part Metadata"
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      bgcolor: 'background.paper',
      p: 1.5,
    }}
    fields={[
      { label: 'Part Name', value: row.partName },
      { label: 'Snapshot Name', value: row?.materialSnapshotName },
      { label: 'Supplier Label', value: row.receivedLabelName },
    ]}
  />
);

export default PartMetadataSection;
