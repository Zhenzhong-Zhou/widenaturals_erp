import { type FC } from 'react';
import Box from '@mui/material/Box';
import { CustomTypography, DetailsSection } from '@components/index';
import { formatDateTime } from '@utils/dateTimeUtils';
import type { FlattenedLocationTypeRecord } from '@features/locationType/state';

/**
 * Expanded detail section for a Location Type record.
 *
 * Purpose:
 * - Surface lifecycle and governance metadata
 * - Keep the main table focused on primary identity fields
 * - Avoid duplication of visible columns
 *
 * This panel intentionally excludes:
 * - Name
 * - Code
 * Since they are already visible in the main table.
 */
interface LocationTypeExpandedContentProps {
  row: FlattenedLocationTypeRecord;
}

const LocationTypeExpandedContent: FC<
  LocationTypeExpandedContentProps
> = ({ row }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography
        variant="subtitle1"
        sx={{ fontWeight: 600, mb: 2 }}
      >
        Location Type Metadata
      </CustomTypography>
      
      {/* --------------------------------------------------
       * Description
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Description"
        fields={[
          {
            label: 'Description',
            value: row.description ?? '—',
          },
        ]}
      />
      
      {/* --------------------------------------------------
       * Audit & Governance
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Audit & Governance"
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
            value: row.updatedByName ?? '—',
          },
        ]}
      />
    </Box>
  );
};

export default LocationTypeExpandedContent;
