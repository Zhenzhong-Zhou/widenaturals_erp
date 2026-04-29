import { type FC } from 'react';
import Box from '@mui/material/Box';
import { CustomTypography, DetailsSection } from '@components/index';
import { formatDateTime } from '@utils/dateTimeUtils';
import type { PricingTypeRecord } from '@features/pricingType';

/**
 * Expanded detail section for a pricing type record row.
 *
 * Displays secondary and audit-level information that is
 * intentionally NOT shown in the main table columns.
 */
interface PricingTypeExpandedContentProps {
  row: PricingTypeRecord;
}

const PricingTypeExpandedContent: FC<PricingTypeExpandedContentProps> = ({
                                                                           row,
                                                                         }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Pricing Type Details
      </CustomTypography>
      
      {/* --------------------------------------------------
       * Description
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Description"
        fields={[
          { label: 'Description', value: row.description ?? '—' },
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
            value: row.audit.createdAt,
            format: formatDateTime,
          },
          {
            label: 'Created By',
            value: row.audit.createdBy?.name ?? '—' ,
          },
          {
            label: 'Last Updated At',
            value: row.audit.updatedAt,
            format: formatDateTime,
          },
          {
            label: 'Last Updated By',
            value: row.audit.updatedBy?.name ?? '—',
          },
        ]}
      />
    </Box>
  );
};

export default PricingTypeExpandedContent;
