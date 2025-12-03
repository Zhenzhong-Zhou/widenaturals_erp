import { type FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedSkuRecord } from '@features/sku/state';

/**
 * Expanded detail section for an SKU record row.
 *
 * Uses the shared <DetailsSection /> component for consistent,
 * readable, and responsive metadata presentation.
 */
interface SkuExpandedContentProps {
  row: FlattenedSkuRecord;
}

const SkuExpandedContent: FC<SkuExpandedContentProps> = ({ row }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        SKU Information Overview
      </CustomTypography>

      {/* ------------------------------------
       * Product Information
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="Product Information"
        fields={[
          {
            label: 'Product Name',
            value: row.productName,
            format: formatLabel,
          },
          { label: 'Brand', value: row.brand, format: formatLabel },
          { label: 'Series', value: row.series, format: formatLabel },
          { label: 'Category', value: row.category, format: formatLabel },
        ]}
      />

      {/* ------------------------------------
       * SKU Core Attributes
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="SKU Attributes"
        fields={[
          {
            label: 'Display Label',
            value: row.displayLabel,
            format: formatLabel,
          },
          {
            label: 'Country Code',
            value: row.countryCode,
            format: formatLabel,
          },
        ]}
      />

      {/* ------------------------------------
       * Status
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="Status Information"
        fields={[
          { label: 'Status', value: row.statusName, format: formatLabel },
          {
            label: 'Status Date',
            value: row.statusDate,
            format: formatDateTime,
          },
        ]}
      />

      {/* ------------------------------------
       * Audit
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="Audit Trail"
        fields={[
          { label: 'Created By', value: row.createdBy, format: formatLabel },
          { label: 'Created At', value: row.createdAt, format: formatDateTime },
          { label: 'Updated By', value: row.updatedBy, format: formatLabel },
          { label: 'Updated At', value: row.updatedAt, format: formatDateTime },
        ]}
      />
    </Box>
  );
};

export default SkuExpandedContent;
