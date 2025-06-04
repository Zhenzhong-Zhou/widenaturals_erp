import { type FC, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import LocationTypeDetailsTable from '@features/locationType/components/LocationTypeDetailsTable';
import CustomButton from '@components/common/CustomButton';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import useLocationTypeDetail from '@hooks/useLocationTypeDetail';

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
    return (
      <CustomTypography variant={'h4'}>
        No location type found.
      </CustomTypography>
    );

  return (
    <Box>
      {locationType && (
        <>
          {/* Location Type Overview Section */}
          <Paper sx={{ padding: 2, marginBottom: 3 }}>
            <CustomTypography variant="h4" gutterBottom>
              {locationType.location_type_name} - Location Type Details
            </CustomTypography>
            <CustomTypography variant="subtitle1" color="textSecondary">
              {locationType.location_type_description}
            </CustomTypography>
            <Divider sx={{ marginY: 2 }} />
            <CustomTypography>
              <strong>Status:</strong> {formatLabel(locationType.status_name)}
            </CustomTypography>
            <CustomTypography>
              <strong>Status Date:</strong>{' '}
              {formatDateTime(locationType.status_date)}
            </CustomTypography>
            <CustomTypography>
              <strong>Created At:</strong>{' '}
              {formatDateTime(locationType.created_at)}
            </CustomTypography>
            <CustomTypography>
              <strong>Updated At:</strong>{' '}
              {formatDateTime(locationType.updated_at)}
            </CustomTypography>
            <CustomTypography>
              <strong>Created By:</strong> {locationType.created_by}
            </CustomTypography>
            <CustomTypography>
              <strong>Updated By:</strong> {locationType.updated_by}
            </CustomTypography>
          </Paper>
        </>
      )}

      <LocationTypeDetailsTable
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
