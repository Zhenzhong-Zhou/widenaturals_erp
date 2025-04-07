import { FC } from 'react';
import { CustomTable } from '@components/index.ts';
import { Compliance } from '../state/complianceTypes.ts';
import { formatLabel, toUpperCase } from '@utils/textUtils.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';

interface ComplianceTableProps {
  data: Compliance[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

const ComplianceTable: FC<ComplianceTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalRecords,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const columns = [
    {
      id: 'product_name',
      label: 'Product Name',
      minWidth: 170,
      sortable: true,
    },
    {
      id: 'type',
      label: 'Type',
      minWidth: 150,
      sortable: true,
      format: (value: string) => toUpperCase(value),
    },
    {
      id: 'compliance_id',
      label: 'Compliance ID',
      minWidth: 150,
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 250,
    },
    {
      id: 'issued_date',
      label: 'Issued Date',
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: 'expiry_date',
      label: 'Expiry Date',
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: 'status_name',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatLabel(value),
    },
    {
      id: 'status_date',
      label: 'Status Date',
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: 'created_by',
      label: 'Created By',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'created_at',
      label: 'Created At',
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: 'updated_by',
      label: 'Updated By',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[10, 25, 50]}
      totalRecords={totalRecords}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default ComplianceTable;
