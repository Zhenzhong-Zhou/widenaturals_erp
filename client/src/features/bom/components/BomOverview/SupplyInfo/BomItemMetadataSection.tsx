import type { FC } from 'react';
import type { FlattenedBomSupplyRow } from '@features/bom/state';
import DetailsSection from '@components/common/DetailsSection';
import { formatLabel } from '@utils/textUtils';

const BomItemMetadataSection: FC<{ row: FlattenedBomSupplyRow }> = ({
  row,
}) => (
  <DetailsSection
    sectionTitle="BOM Item Material Info"
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      bgcolor: 'background.paper',
      p: 1.5,
    }}
    fields={[
      { label: 'BOM Unit', value: row.bomUnit },
      { label: 'Per Product Qty', value: row.requiredQtyPerProduct },
      { label: 'Item Material Note', value: row.materialNote },
      {
        label: 'Item Material Status',
        value: row.bomItemMaterialStatusName,
        format: formatLabel,
      },
      {
        label: 'Item Material Status Date',
        value: row.bomItemMaterialStatusDate,
      },
      {
        label: 'Item Material Created At',
        value: row.bomItemMaterialCreatedAt,
      },
      {
        label: 'Item Material Created By',
        value: row.bomItemMaterialCreatedBy,
      },
      {
        label: 'Item Material Updated At',
        value: row.bomItemMaterialUpdatedAt,
      },
      {
        label: 'Item Material Updated By',
        value: row.bomItemMaterialUpdatedBy,
      },
    ]}
  />
);

export default BomItemMetadataSection;
