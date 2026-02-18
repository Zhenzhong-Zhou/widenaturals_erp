import type { FC } from 'react';
import Paper from '@mui/material/Paper';
import { DetailsSectionField } from '@components/common/DetailsSection';
import { CustomTypography, DetailsSection } from '@components/index';
import { FlattenedLocationTypeDetails } from '@features/locationType/state';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';

const buildStatusFields = (
  l: FlattenedLocationTypeDetails
): DetailsSectionField[] => [
  {
    label: 'Status',
    value: l.statusName,
    format: (v) => (v ? formatLabel(v) : '—'),
  },
  {
    label: 'Status Updated At',
    value: l.statusDate,
    format: (v) => (v ? formatDateTime(v) : '—'),
  },
];

interface Props {
  locationType: FlattenedLocationTypeDetails;
}

const LocationTypeDetailStatusSection: FC<Props> = ({
                                                      locationType,
                                                    }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
      <CustomTypography variant="h6" fontWeight={600} gutterBottom>
        Status
      </CustomTypography>
      
      <DetailsSection fields={buildStatusFields(locationType)} />
    </Paper>
  );
};

export default LocationTypeDetailStatusSection;
