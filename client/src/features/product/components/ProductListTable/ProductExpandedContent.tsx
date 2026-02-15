import { type FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDateTime } from '@utils/dateTimeUtils';
import type { FlattenedProductRecord } from '@features/product/state/productTypes';
import { formatLabel } from '@utils/textUtils';

/**
 * Expanded detail section for a Product list row.
 *
 * Mirrors the SKU expanded view format for consistency across modules.
 */
interface ProductExpandedContentProps {
  row: FlattenedProductRecord;
}

const ProductExpandedContent: FC<ProductExpandedContentProps> = ({ row }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Product Information Metadata
      </CustomTypography>

      {/* ------------------------------------
       * Audit Trail
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="Audit Trail"
        fields={[
          { label: 'Created At', value: row.createdAt, format: formatDateTime },
          { label: 'Created By', value: row.createdBy, format: formatLabel },
          { label: 'Updated At', value: row.updatedAt, format: formatDateTime },
          { label: 'Updated By', value: row.updatedBy, format: formatLabel },
        ]}
      />
    </Box>
  );
};

export default ProductExpandedContent;
