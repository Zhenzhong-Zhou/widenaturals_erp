import { type FC } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { CustomButton, CustomTypography, DetailsSection, GoBackButton } from '@components/index';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';
import type { PricingTypeDetailRecord } from '@features/pricingType';

interface PricingTypeDetailPanelProps {
  pricingType: PricingTypeDetailRecord;
  onEdit: () => void;
}

/**
 * Displays identity, description, status, and audit details
 * for a single pricing type record.
 *
 * Intentionally presentational — no data fetching.
 */
const PricingTypeDetailPanel: FC<PricingTypeDetailPanelProps> = ({
                                                                   pricingType,
                                                                   onEdit,
                                                                 }) => {
  return (
    <>
      {/* --------------------------------------------------
       * Page Header
       * -------------------------------------------------- */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        mb={1}
        gap={2}
      >
        <Box>
          <CustomTypography variant="h5" fontWeight={700}>
            {pricingType.name}
          </CustomTypography>
          <CustomTypography variant="body2" color="text.secondary">
            {pricingType.code} · {pricingType.slug} · {formatLabel(pricingType.status.name)}
          </CustomTypography>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center">
          <GoBackButton />
          <CustomButton
            variant="outlined"
            onClick={onEdit}
            sx={{ height: 50, borderRadius: '50px', px: 3 }}
          >
            Edit Type
          </CustomButton>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* --------------------------------------------------
       * Description
       * -------------------------------------------------- */}
      {pricingType.description && (
        <Box mb={3}>
          <CustomTypography variant="body1" color="text.secondary">
            {pricingType.description}
          </CustomTypography>
        </Box>
      )}
      
      {/* --------------------------------------------------
       * Status
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Status"
        fields={[
          {
            label: 'Status',
            value: pricingType.status.name,
            format: formatLabel,
          },
          {
            label: 'Status Effective Date',
            value: pricingType.status.date,
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
            value: pricingType.audit.createdAt,
            format: formatDateTime,
          },
          {
            label: 'Created By',
            value: pricingType.audit.createdBy?.name ?? '—',
          },
          {
            label: 'Last Updated At',
            value: pricingType.audit.updatedAt,
            format: formatDateTime,
          },
          {
            label: 'Last Updated By',
            value: pricingType.audit.updatedBy?.name ?? '—',
          },
        ]}
      />
    </>
  );
};

export default PricingTypeDetailPanel;
