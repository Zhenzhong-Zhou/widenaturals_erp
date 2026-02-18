import type { FC } from 'react';
import Paper from '@mui/material/Paper';
import { DetailsSectionField } from '@components/common/DetailsSection';
import { CustomTypography, DetailsSection } from '@components/index';
import { FlattenedLocationTypeDetails } from '@features/locationType/state';
import { formatLabel } from '@utils/textUtils';

const buildLocationTypeInfoFields = (
  l: FlattenedLocationTypeDetails
): DetailsSectionField[] => [
  {
    label: 'Code',
    value: l.code,
    format: (v) => (v ? v : '—'),
  },
  {
    label: 'Name',
    value: l.name,
    format: (v) => (v ? formatLabel(v) : '—'),
  },
  {
    label: 'Description',
    value: l.description,
    format: (v) => v || '—',
  },
];

interface Props {
  locationType: FlattenedLocationTypeDetails;
}

const LocationTypeDetailInformationSection: FC<Props> = ({
                                                           locationType,
                                                         }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
      <CustomTypography variant="h6" fontWeight={600} gutterBottom>
        Location Type Information
      </CustomTypography>
      
      <DetailsSection fields={buildLocationTypeInfoFields(locationType)} />
    </Paper>
  );
};

export default LocationTypeDetailInformationSection;
