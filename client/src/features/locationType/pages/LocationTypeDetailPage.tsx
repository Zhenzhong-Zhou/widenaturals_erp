import { FC, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLocationTypeDetail } from '../../../hooks';
import { LocationTypeDetailTable } from '../index.ts';
import {
  CustomButton,
  ErrorDisplay,
  ErrorMessage,
  Loading,
  Typography,
} from '@components/index.ts';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import { formatDateTime } from '@utils/dateTimeUtils.ts';
import { formatLabel } from '@utils/textUtils.ts';

const LocationTypeDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>(); // Get ID from URL params
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Fetch location type details
  const { locationType, locations, pagination, loading, error, refresh } =
    useLocationTypeDetail(id!, page, rowsPerPage);

  if (loading)
    return (
      <Loading
        message={`Loading Location Type ${locationType?.location_type_name} Detail...`}
      />
    );
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  if (!locationType)
    return <Typography variant={'h4'}>No location type found.</Typography>;

  return (
    <Box>
      {locationType && (
        <>
          {/* Location Type Overview Section */}
          <Paper sx={{ padding: 2, marginBottom: 3 }}>
            <Typography variant="h4" gutterBottom>
              {locationType.location_type_name} - Location Type Details
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {locationType.location_type_description}
            </Typography>
            <Divider sx={{ marginY: 2 }} />
            <Typography>
              <strong>Status:</strong>{' '}
              {formatLabel(locationType.status_name)}
            </Typography>
            <Typography>
              <strong>Status Date:</strong>{' '}
              {formatDateTime(locationType.status_date)}
            </Typography>
            <Typography>
              <strong>Created At:</strong>{' '}
              {formatDateTime(locationType.created_at)}
            </Typography>
            <Typography>
              <strong>Updated At:</strong>{' '}
              {formatDateTime(locationType.updated_at)}
            </Typography>
            <Typography>
              <strong>Created By:</strong> {locationType.created_by}
            </Typography>
            <Typography>
              <strong>Updated By:</strong> {locationType.updated_by}
            </Typography>
          </Paper>
        </>
      )}

      <LocationTypeDetailTable
        data={locations}
        page={pagination.page}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => setPage(newPage)}
        onRowsPerPageChange={(newRowsPerPage) => setRowsPerPage(newRowsPerPage)}
      />

      <CustomButton onClick={refresh} style={{ marginTop: '10px' }}>
        Refresh Data
      </CustomButton>
    </Box>
  );
};

export default LocationTypeDetailPage;
