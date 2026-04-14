import { type FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDate } from '@utils/dateTimeUtils';
import type { FlattenedPricingJoinRecord } from '@features/pricing';
import { formatLabel } from '@utils/textUtils';

interface PricingExpandedContentProps {
  row: FlattenedPricingJoinRecord;
}

const PricingExpandedContent: FC<PricingExpandedContentProps> = ({ row }) => {
 console.log(row)
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Pricing Record Metadata
      </CustomTypography>
      
      {/* ------------------------------------
       * SKU Details
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="SKU Details"
        fields={[
          { label: 'SKU',             value: row.sku },
          { label: 'Size',            value: row.sizeLabel },
          { label: 'SKU Country',     value: row.skuCountryCode },
        ]}
      />
      
      {/* ------------------------------------
       * Product Details
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="Product Details"
        fields={[
          { label: 'Category',        value: row.category },
          { label: 'Product Name',    value: row.productName },
        ]}
      />
      
      {/* ------------------------------------
       * Pricing Type Details
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="Pricing Type"
        fields={[
          { label: 'Type Code',       value: row.pricingTypeCode },
        ]}
      />
      
      {/* ------------------------------------
       * Status Details
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="Status"
        fields={[
          { label: 'Status',          value: row.statusName, format: formatLabel },
          { label: 'Status Date',     value: row.statusDate, format: formatDate },
        ]}
      />
    </Box>
  );
};

export default PricingExpandedContent;
