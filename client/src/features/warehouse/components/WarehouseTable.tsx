import { FC, useState } from 'react';
import { Warehouse } from '../state/warehouseTypes.ts';
import { CustomTable } from '@components/index.ts';
import { formatDateTime } from '@utils/dateTimeUtils.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
// import { Link } from 'react-router-dom';

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

  const columns = [
    {
      id: 'warehouse_name',
      label: 'Warehouse Name',
      sortable: true,
      format: (value: string) => value,
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
      format: (value: string) => capitalizeFirstLetter(value),
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
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      sortable: true,
      format: (value: string) => formatDateTime(value),
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
