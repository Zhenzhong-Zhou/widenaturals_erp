import { type FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel, formatPhoneNumber } from '@utils/textUtils';
import type { FlattenedUserRecord } from '@features/user/state';

/**
 * Expanded detail section for a User record row.
 *
 * Uses the shared <DetailsSection /> component for consistent,
 * readable, and responsive metadata presentation.
 */
interface UserExpandedContentProps {
  row: FlattenedUserRecord;
}

const UserExpandedContent: FC<UserExpandedContentProps> = ({ row }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        User Information Overview
      </CustomTypography>
      
      {/* ------------------------------------
       * Identity Information
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="Identity Information"
        fields={[
          {
            label: 'Phone Number',
            value: row.phoneNumber,
            format: formatPhoneNumber,
          },
        ]}
      />
      
      {/* ------------------------------------
       * Status
       * ------------------------------------ */}
      <DetailsSection
        sectionTitle="Status Information"
        fields={[
          {
            label: 'Status',
            value: row.statusName,
            format: formatLabel,
          },
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
            value: row.createdBy,
            format: formatLabel,
          },
          {
            label: 'Created At',
            value: row.createdAt,
            format: formatDateTime,
          },
          {
            label: 'Updated By',
            value: row.updatedBy,
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

export default UserExpandedContent;
