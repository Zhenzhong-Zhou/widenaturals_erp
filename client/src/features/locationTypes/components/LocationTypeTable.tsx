import { FC } from 'react';
import { LocationType } from '../../locationTypes';
import { CustomTable } from '@components/index.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import { formatDateTime } from '@utils/dateTimeUtils.ts';

interface LocationTypesTableProps {
  data: LocationType[];
  page: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const LocationTypeTable: FC<LocationTypesTableProps> = ({
                                                           data,
                                                           page,
                                                           totalRecords,
                                                           totalPages,
                                                           onPageChange,
                                                           onRowsPerPageChange,
                                                         }) => {
  const columns = [
    { id: 'location_type_name', label: 'Name', sortable: true },
    { id: 'location_type_description', label: 'Description', sortable: false },
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
    { id: 'created_by', label: 'Created By', sortable: true },
    { id: 'updated_by', label: 'Updated By', sortable: true },
  ];
  
  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      totalRecords={totalRecords}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default LocationTypeTable;
