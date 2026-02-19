import { type FC } from 'react';
import Box from '@mui/material/Box';
import { CustomTypography, DetailsSection } from '@components/index';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type {
  FlattenedPackagingMaterialBatchRow,
} from '@features/packagingMaterialBatch/state';

/**
 * Expanded detail section for a Packaging Material Batch row.
 *
 * Displays secondary and operational metadata intentionally
 * excluded from the main table columns.
 */
interface PackagingMaterialBatchExpandedContentProps {
  row: FlattenedPackagingMaterialBatchRow;
}

const PackagingMaterialBatchExpandedContent: FC<
  PackagingMaterialBatchExpandedContentProps
> = ({ row }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Packaging Material Batch Details
      </CustomTypography>
      
      {/* --------------------------------------------------
       * Material Metadata
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Material Metadata"
        fields={[
          {
            label: 'Internal Name',
            value: row.materialInternalName,
          },
          {
            label: 'Supplier Label',
            value: row.supplierLabel,
          },
          {
            label: 'Material Code',
            value: row.packagingMaterialCode,
          },
          {
            label: 'Category',
            value: row.packagingMaterialCategory,
            format: formatLabel,
          },
        ]}
      />
      
      {/* --------------------------------------------------
       * Supplier Details
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Supplier Details"
        fields={[
          {
            label: 'Supplier',
            value: row.supplierName,
          },
          {
            label: 'Preferred Supplier',
            value: row.isPreferredSupplier ? 'Yes' : 'No',
          },
          {
            label: 'Lead Time (Days)',
            value: row.supplierLeadTimeDays ?? '—',
          },
        ]}
      />
      
      {/* --------------------------------------------------
       * Lifecycle Details
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Lifecycle Details"
        fields={[
          {
            label: 'Manufacture Date',
            value: row.manufactureDate,
            format: formatDate,
          },
          {
            label: 'Expiry Date',
            value: row.expiryDate,
            format: formatDate,
          },
          {
            label: 'Received At',
            value: row.receivedAt,
            format: formatDateTime,
          },
          {
            label: 'Received By',
            value: row.receivedByName || '—',
          },
        ]}
      />
      
      {/* --------------------------------------------------
       * Cost Details
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Cost Details"
        fields={[
          {
            label: 'Unit Cost',
            value: `${row.currency ?? ''} ${row.unitCost ?? '0'}`,
          },
          {
            label: 'Exchange Rate',
            value: row.exchangeRate ?? '1',
          },
          {
            label: 'Total Cost',
            value: `${row.currency ?? ''} ${row.totalCost ?? '0'}`,
          },
        ]}
      />
      
      {/* --------------------------------------------------
       * Status Details
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Status Details"
        fields={[
          {
            label: 'Status',
            value: row.statusName,
            format: formatLabel,
          },
          {
            label: 'Status Effective Date',
            value: row.statusDate,
            format: formatDateTime,
          },
        ]}
      />
      
      {/* --------------------------------------------------
       * Audit
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Audit"
        fields={[
          {
            label: 'Created At',
            value: row.createdAt,
            format: formatDateTime,
          },
          {
            label: 'Created By',
            value: row.createdByName,
          },
          {
            label: 'Last Updated At',
            value: row.updatedAt,
            format: formatDateTime,
          },
          {
            label: 'Last Updated By',
            value: row.updatedByName || '—',
          },
        ]}
      />
    </Box>
  );
};

export default PackagingMaterialBatchExpandedContent;
