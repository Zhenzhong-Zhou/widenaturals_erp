import { FC } from 'react';
import {PricingTypeTableProps } from '../state/pricingTypeTypes.ts';
import { DataTable } from '@components/index.ts';

const PricingTypeTable: FC<PricingTypeTableProps> = ({
                                                       data,
                                                       totalRecords,
                                                       rowsPerPage,
                                                       page,
                                                       onPageChange,
                                                       onRowsPerPageChange,
                                                     }) => {
  const columns = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'description', label: 'Description', sortable: false },
    { id: 'status', label: 'Status', sortable: true },
    { id: 'created_by_fullname', label: 'Created By', sortable: false },
  ];
  
  return (
    <DataTable
      columns={columns}
      data={data}
      rowsPerPageOptions={[5, 10, 25]}
      initialRowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default PricingTypeTable;
