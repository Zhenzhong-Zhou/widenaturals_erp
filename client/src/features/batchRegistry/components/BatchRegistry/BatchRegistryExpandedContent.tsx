import { type FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedBatchRegistryRecord } from '@features/batchRegistry/state';

/**
 * Expanded detail section for a Batch Registry record row.
 *
 * Uses the shared <DetailsSection /> component to provide
 * a consistent, readable audit-style layout.
 */
interface BatchRegistryExpandedContentProps {
  row: FlattenedBatchRegistryRecord;
}

const BatchRegistryExpandedContent: FC<BatchRegistryExpandedContentProps> = ({
  row,
}) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Batch Registry Details
      </CustomTypography>

      {/* --------------------------------------------------
       * Batch Status
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Batch Status"
        fields={[
          { label: 'Status', value: row.status, format: formatLabel },
          {
            label: 'Status Date',
            value: row.statusDate,
            format: formatDateTime,
          },
        ]}
      />

      {/* --------------------------------------------------
       * Registry Notes
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Registry Notes"
        fields={[
          {
            label: 'Note',
            value: row.note || '—',
          },
        ]}
      />
    </Box>
  );
};

export default BatchRegistryExpandedContent;
