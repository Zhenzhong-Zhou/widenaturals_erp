import { type FC } from 'react';
import Box from '@mui/material/Box';
import { CustomTypography, DetailsSection } from '@components/index';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedProductBatchRecord } from '@features/productBatch/state';

/**
 * Expanded detail section for a Product Batch record row.
 *
 * Displays secondary and audit-level information that is
 * intentionally NOT shown in the main table columns.
 */
interface ProductBatchExpandedContentProps {
  row: FlattenedProductBatchRecord;
}

const ProductBatchExpandedContent: FC<ProductBatchExpandedContentProps> = ({
  row,
}) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Product Batch Details
      </CustomTypography>

      {/* --------------------------------------------------
       * Product Metadata
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Product Metadata"
        fields={[
          { label: 'Product Name', value: row.productName },
          { label: 'Size', value: row.sizeLabel },
          { label: 'Brand', value: row.productBrand },
          { label: 'Category', value: row.productCategory },
        ]}
      />

      {/* --------------------------------------------------
       * Status Metadata
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
          {
            label: 'Released By',
            value: row.releasedByName || '—',
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

export default ProductBatchExpandedContent;
