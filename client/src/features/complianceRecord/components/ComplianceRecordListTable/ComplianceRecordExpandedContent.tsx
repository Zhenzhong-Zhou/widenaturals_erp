import { type FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { ComplianceRecordTableRow } from '@features/complianceRecord/state';

/**
 * Expanded detail section for a compliance record row.
 *
 * Uses the shared <DetailsSection /> component for consistent,
 * readable, and structured metadata presentation.
 */
interface ComplianceRecordExpandedContentProps {
  row: ComplianceRecordTableRow;
}

const ComplianceRecordExpandedContent: FC<
  ComplianceRecordExpandedContentProps
> = ({ row }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Compliance Record Overview
      </CustomTypography>

      {/* ------------------------------------
       * Product Information
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="Product Information"
        fields={[
          { label: 'Series', value: row.series, format: formatLabel },
          { label: 'Category', value: row.category, format: formatLabel },
        ]}
      />

      {/* ------------------------------------
       * SKU Information
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="SKU Information"
        fields={[{ label: 'Size', value: row.sizeLabel, format: formatLabel }]}
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
          {
            label: 'Created By',
            value: row.createdByName,
            format: formatLabel,
          },
          {
            label: 'Created At',
            value: row.createdAt,
            format: formatDateTime,
          },
          {
            label: 'Updated By',
            value: row.updatedByName,
            format: formatLabel,
          },
          {
            label: 'Updated At',
            value: row.updatedAt,
            format: formatDateTime,
          },
        ]}
      />
    </Box>
  );
};

export default ComplianceRecordExpandedContent;
