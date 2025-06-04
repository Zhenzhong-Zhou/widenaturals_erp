import type { FC } from 'react';
// import { Link } from 'react-router-dom';
// import { Link } from 'react-router-dom';
import type { Location } from '@features/location';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import CustomTable, { type Column } from '@components/common/CustomTable';

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
  const columns: Column<Location>[] = [
    { id: 'location_type_name', label: 'Location Type', sortable: true },
    {
      id: 'location_name',
      label: 'Location Name',
      sortable: true,
      format: (value) => value as string,
      // renderCell: (row: any) => (
      //   <Link
      //     to={`/locations/${row.location_id || 'unknown'}`}
      //     style={{ textDecoration: 'none', color: 'blue' }}
      //   >
      //     {row.location_name}
      //   </Link>
      // ),
    },
    { id: 'address', label: 'Address', sortable: false },
    {
      id: 'status_name',
      label: 'Status',
      sortable: true,
      format: (value) => formatLabel(value as string),
    },
    {
      id: 'status_date',
      label: 'Status Date',
      sortable: true,
      format: (value) => formatDateTime(value as string),
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      format: (value) => formatDateTime(value as string),
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      sortable: true,
      format: (value) => formatDateTime(value as string),
    },
    { id: 'created_by', label: 'Created By', sortable: false },
    { id: 'updated_by', label: 'Updated By', sortable: false },
  ];

  return (
    <Box>
      {data.length === 0 ? (
        <CustomTypography sx={{ textAlign: 'center', padding: 2 }}>
          No locations found.
        </CustomTypography>
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
