import { FC } from 'react';
import { PricingTypeTableProps } from '../state/pricingTypeTypes.ts';
import { CustomTable } from '@components/index.ts';
import { formatDateTime } from '@utils/dateTimeUtils.ts';

const PricingTypeTable: FC<PricingTypeTableProps> = ({
                                                       data,
                                                       totalPages,
                                                       totalRecords,
                                                       rowsPerPage,
                                                       page,
                                                       onPageChange,
                                                       onRowsPerPageChange,
                                                     }) => {
  // Define columns for the DataTable
  const columns = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'description', label: 'Description', sortable: false },
    { id: 'status', label: 'Status', sortable: true },
    { id: 'status_date', label: 'Status Date', sortable: true, format: (value: string | number | Date) => formatDateTime(value) },
    { id: 'created_at', label: 'Created At', sortable: true, format: (value: string | number | Date) => formatDateTime(value) },
    { id: 'updated_at', label: 'Updated At', sortable: true, format: (value: string | number | Date) => formatDateTime(value) },
    { id: 'created_by_fullname', label: 'Created By', sortable: true },
    { id: 'updated_by_fullname', label: 'Updated By', sortable: true },
  ];
  
  return (
    <CustomTable
      columns={columns}
      data={data}
      rowsPerPageOptions={[5, 10, 25]}
      initialRowsPerPage={rowsPerPage}
      totalRecords={totalRecords}
      totalPages={totalPages}
      page={page}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default PricingTypeTable;
