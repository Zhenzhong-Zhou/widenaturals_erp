import { type FC } from 'react';
import Box from '@mui/material/Box';
import { CustomTypography, DetailsSection } from '@components/index';
import { formatDateTime } from '@utils/dateTimeUtils';
import type { PricingGroupRecord } from '@features/pricingGroup';

/**
 * Expanded detail section for a pricing group record row.
 *
 * Displays pricing type identity and audit-level information that is
 * intentionally NOT shown in the main table columns.
 */
interface PricingGroupExpandedContentProps {
  row: PricingGroupRecord;
}

const PricingGroupExpandedContent: FC<PricingGroupExpandedContentProps> = ({
                                                                             row,
                                                                           }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Pricing Group Details
      </CustomTypography>
      
      {/* --------------------------------------------------
       * Pricing Type
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Pricing Type"
        fields={[
          { label: 'Name', value: row.pricingTypeName },
          { label: 'Code', value: row.pricingTypeCode },
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
            value: row.audit?.createdAt ?? '—',
            format: row.audit?.createdAt ? formatDateTime : undefined,
          },
          {
            label: 'Created By',
            value: row.audit?.createdBy?.name ?? '—',
          },
          {
            label: 'Last Updated At',
            value: row.audit?.updatedAt ?? '—',
            format: row.audit?.updatedAt ? formatDateTime : undefined,
          },
          {
            label: 'Last Updated By',
            value: row.audit?.updatedBy?.name ?? '—',
          },
        ]}
      />
    </Box>
  );
};

export default PricingGroupExpandedContent;
