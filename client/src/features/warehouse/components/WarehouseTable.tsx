import { type FC, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { Link } from 'react-router-dom';
import type { Warehouse } from '@features/warehouse';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import CustomTable, { type Column } from '@components/common/CustomTable';

interface WarehouseTableProps {
  warehouses: Warehouse[];
  totalPages?: number;
  totalRecords?: number;
  page: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const WarehouseTable: FC<WarehouseTableProps> = ({
  warehouses,
  totalPages = 1,
  totalRecords = 0,
  page,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns: Column<Warehouse>[] = [
    {
      id: 'warehouse_name',
      label: 'Warehouse Name',
      sortable: true,
      format: (value) => value as string,
      // renderCell: (row: Warehouse) => (
      //   <Link
      //     to={`/warehouses/${row.id}`}
      //     style={{ textDecoration: 'none', color: 'blue' }}
      //   >
      //     {row.warehouse_name}
      //   </Link>
      // ),
    },
    {
      id: 'location_name',
      label: 'Location',
      sortable: true,
    },
    {
      id: 'storage_capacity',
      label: 'Capacity',
      sortable: true,
    },
    {
      id: 'status_name',
      label: 'Status',
      sortable: true,
      format: (value) => formatLabel(value as string),
    },
    {
      id: 'created_by',
      label: 'Created By',
      sortable: false,
    },
    {
      id: 'updated_by',
      label: 'Updated By',
      sortable: false,
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
  ];

  return (
    <CustomTable
      columns={columns}
      data={warehouses}
      rowsPerPageOptions={[5, 10, 25]}
      initialRowsPerPage={rowsPerPage}
      totalPages={totalPages}
      totalRecords={totalRecords}
      page={page}
      onPageChange={onPageChange}
      onRowsPerPageChange={(newRowsPerPage) => {
        setRowsPerPage(newRowsPerPage);
        onRowsPerPageChange(newRowsPerPage);
      }}
    />
  );
};

export default WarehouseTable;
