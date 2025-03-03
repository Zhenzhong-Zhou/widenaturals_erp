import { FC } from 'react';
import { CustomTable, Typography } from '@components/index.ts';
import { Location } from '../state/locationTypeTypes.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import { formatDateTime } from '@utils/dateTimeUtils.ts';
import { Box, Paper } from '@mui/material';

interface LocationTypeTableProps {
  data: Location[];
  page: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const LocationTypeTable: FC<LocationTypeTableProps> = ({
  data,
  page,
  totalRecords,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const columns = [
    { id: 'location_name', label: 'Location Name', sortable: true },
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
    {
      id: 'created_by',
      label: 'Created By',
      sortable: true,
    },
    {
      id: 'updated_by',
      label: 'Updated By',
      sortable: true,
    },
  ];

  return (
    <Box>
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h6">General Information</Typography>
        <Typography>
          <strong>Total Locations:</strong> {data.length}
        </Typography>
      </Paper>

      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant={'h3'}>Associated Locations</Typography>
        <CustomTable
          columns={columns}
          data={data}
          page={page}
          totalRecords={totalRecords}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      </Paper>
    </Box>
  );
};

export default LocationTypeTable;
