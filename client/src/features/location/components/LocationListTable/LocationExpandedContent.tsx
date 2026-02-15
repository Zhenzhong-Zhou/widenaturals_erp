import { type FC } from 'react';
import Box from '@mui/material/Box';
import { CustomTypography, DetailsSection } from '@components/index';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedLocationListRecord } from '@features/location/state';

/**
 * Expanded detail section for a Location record.
 *
 * Purpose:
 * - Surface secondary lifecycle and governance metadata
 * - Keep main table focused on operational information
 * - Avoid duplication of primary columns
 *
 * This panel intentionally excludes:
 * - Name
 * - Location type
 * - Geography
 * Since they are already visible in the main table.
 */
interface LocationExpandedContentProps {
  row: FlattenedLocationListRecord;
}

const LocationExpandedContent: FC<LocationExpandedContentProps> = ({
                                                                     row,
                                                                   }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography
        variant="subtitle1"
        sx={{ fontWeight: 600, mb: 2 }}
      >
        Location Metadata
      </CustomTypography>
      
      {/* --------------------------------------------------
       * Status Lifecycle
       * -------------------------------------------------- */}
      <DetailsSection
        sectionTitle="Status Lifecycle"
        fields={[
          {
            label: 'Current Status',
            value: row.statusName,
            format: formatLabel,
          },
          {
            label: 'Status Effective Date',
            value: row.statusDate,
            format: formatDateTime,
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

export default LocationExpandedContent;
