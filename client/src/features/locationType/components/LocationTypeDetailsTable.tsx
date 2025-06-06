import type { FC } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import CustomTypography from '@components/common/CustomTypography';
import CustomTable from '@components/common/CustomTable';
import type { LocationType } from '@features/locationType';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';

interface LocationTypeTableProps {
  data: LocationType[];
  page: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const LocationTypeDetailsTable: FC<LocationTypeTableProps> = ({
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
      format: (value: string) => formatLabel(value),
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
        <CustomTypography variant="h6">General Information</CustomTypography>
        <CustomTypography>
          <strong>Total Locations:</strong> {data.length}
        </CustomTypography>
      </Paper>

      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <CustomTypography variant={'h3'}>Associated Locations</CustomTypography>
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

export default LocationTypeDetailsTable;
