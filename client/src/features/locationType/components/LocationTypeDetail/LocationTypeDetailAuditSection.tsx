import type { FC } from 'react';
import Paper from '@mui/material/Paper';
import type { DetailsSectionField } from '@components/common/DetailsSection';
import { CustomTypography, DetailsSection } from '@components/index';
import type { FlattenedLocationTypeDetails } from '@features/locationType/state';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

const buildAuditFields = (
  locationType: FlattenedLocationTypeDetails
): DetailsSectionField[] => [
  {
    label: 'Created At',
    value: locationType.createdAt,
    format: (v) => (v ? formatDateTime(v) : '—'),
  },
  {
    label: 'Created By',
    value: locationType.createdByName,
    format: (v) => (v ? formatLabel(v) : '—'),
  },
  {
    label: 'Updated At',
    value: locationType.updatedAt,
    format: (v) => (v ? formatDateTime(v) : 'Never updated'),
  },
  {
    label: 'Updated By',
    value: locationType.updatedByName,
    format: (v) => (v ? formatLabel(v) : '—'),
  },
];

interface Props {
  locationType: FlattenedLocationTypeDetails;
}

const LocationTypeDetailAuditSection: FC<Props> = ({ locationType }) => {
  return (
    <Paper sx={{ p: 3 }} elevation={1}>
      <CustomTypography variant="h6" fontWeight={600} gutterBottom>
        Audit Information
      </CustomTypography>

      <DetailsSection fields={buildAuditFields(locationType)} />
    </Paper>
  );
};

export default LocationTypeDetailAuditSection;
