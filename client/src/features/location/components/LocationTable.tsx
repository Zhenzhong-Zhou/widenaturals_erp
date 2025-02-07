import { FC } from 'react';
import { CustomTable, Typography } from '@components/index.ts';
import { Location } from '../state/locationTypes.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import { formatDateTime } from '@utils/dateTimeUtils.ts';
import Box from '@mui/material/Box';
import { Link } from 'react-router-dom';

interface LocationTableProps {
  data: Location[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const LocationTable: FC<LocationTableProps> = ({
                                                 data,
                                                 page = 1,
                                                 rowsPerPage,
                                                 totalRecords = 0,
                                                 totalPages = 1,
                                                 onPageChange,
                                                 onRowsPerPageChange,
                                               }) => {
  const columns = [
    { id: 'location_type_name', label: 'Location Type', sortable: true },
    {
      id: 'location_name',
      label: 'Location Name',
      sortable: true,
      format: (value: string, row: any) => (
        <Link to={`/locations/${row.location_id}`} style={{ textDecoration: 'none', color: 'blue' }}>
          {value}
        </Link>
      ),
    },
    { id: 'address', label: 'Address', sortable: false },
    {
      id: 'status_name',
      label: 'Status',
      sortable: true,
      format: (value: string) => capitalizeFirstLetter(value),
    },
    {
      id: 'status_date',
      label: 'Status Date',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    { id: 'created_by', label: 'Created By', sortable: false },
    { id: 'updated_by', label: 'Updated By', sortable: false },
  ];
  
  return (
    <Box>
      {data.length === 0 ? (
        <Typography sx={{ textAlign: 'center', padding: 2 }}>No locations found.</Typography>
      ) : (
        <CustomTable
          columns={columns}
          data={data}
          page={page}
          initialRowsPerPage={rowsPerPage}
          totalRecords={totalRecords}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      )}
    </Box>
  );
};

export default LocationTable;
