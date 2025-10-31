import type { FC } from 'react';
import type { FlattenedBomSupplyRow } from '@features/bom/state';
import DetailsSection from '@components/common/DetailsSection';
import { formatCurrency, formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';

const PackagingMaterialSection: FC<{ row: FlattenedBomSupplyRow }> = ({ row }) => (
  <DetailsSection
    sectionTitle="Packaging Material Information"
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      bgcolor: 'background.paper',
      p: 1.5,
    }}
    fields={[
      { label: 'Material Code', value: row.packagingMaterialCode },
      { label: 'Category', value: row.category },
      { label: 'Composition', value: row.materialComposition },
      { label: 'Color', value: row.color },
      { label: 'Size', value: row.size },
      { label: 'Grade', value: row.grade },
      { label: 'Estimated Unit Cost', value: row.estimatedUnitCost, format: (v) => formatCurrency(v, row.materialCurrency) },
      { label: 'Material Currency', value: row.materialCurrency },
      { label: 'Exchange Rate', value: row.materialExchangeRate },
      { label: 'Visible for Sales Orders', value: row.isVisibleForSalesOrder ? 'Yes' : 'No' },
      { label: 'Material Length (cm)', value: row.packagingMaterialLengthCm },
      { label: 'Material Width (cm)', value: row.packagingMaterialWidthCm },
      { label: 'Material Height (cm)', value: row.packagingMaterialHeightCm },
      { label: 'Material Weight (g)', value: row.packagingMaterialWeightG },
      { label: 'Material Length (inch)', value: row.packagingMaterialLengthInch },
      { label: 'Material Width (inch)', value: row.packagingMaterialWidthInch },
      { label: 'Material Height (inch)', value: row.packagingMaterialHeightInch },
      { label: 'Material Weight (lbs)', value: row.packagingMaterialWeightLbs },
      { label: 'Material Status', value: row.packagingMaterialStatusName , format: formatLabel },
      { label: 'Material Status Date', value: row.packagingMaterialStatusDate, format: formatDateTime },
      { label: 'Material Created At', value: row.packagingMaterialCreatedAt, format: formatDateTime },
      { label: 'Material Created By', value: row.packagingMaterialCreatedBy, format: formatLabel },
      { label: 'Material Updated At', value: row.packagingMaterialUpdatedAt, format: formatDateTime },
      { label: 'Material Updated By', value: row.packagingMaterialUpdatedBy, format: formatLabel },
    ]}
  />
);

export default PackagingMaterialSection;
