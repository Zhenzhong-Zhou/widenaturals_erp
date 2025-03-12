import { FC } from "react";
import { CustomTable } from '@components/index.ts';
import { OrderType } from '../state/orderTypeTypes.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';

interface OrderTypesTableProps {
  data: OrderType[];
  page?: number; // Optional, do nothing
  totalRecords?: number; // Optional, do nothing
  totalPages?: number; // Optional, do nothing
  onPageChange?: (page: number) => void; // Optional, do nothing
  onRowsPerPageChange?: (rowsPerPage: number) => void; // Optional, do nothing
}

const OrderTypesTable: FC<OrderTypesTableProps> = ({ data }) => {
  const columns = [
    {
      id: "name",
      label: "Order Type",
      minWidth: 170,
      sortable: true,
    },
    {
      id: "category",
      label: "Category",
      minWidth: 150,
      sortable: true,
      format: (value: string) => capitalizeFirstLetter(value),
    },
    {
      id: "description",
      label: "Description",
      minWidth: 250
    },
    {
      id: "status_name",
      label: "Status",
      minWidth: 100,
      sortable: true,
      format: (value: string) => capitalizeFirstLetter(value),
    },
    {
      id: "status_date",
      label: "Status Date",
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: "created_by",
      label: "Created By",
      minWidth: 150,
      sortable: true,
    },
    {
      id: "created_at",
      label: "Created At",
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: "updated_by",
      label: "Updated By",
      minWidth: 150,
      sortable: true,
    },
    {
      id: "updated_at",
      label: "Updated At",
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
  ];
  
  return (
    <CustomTable
      columns={columns}
      data={data}
      page={0}
      totalRecords={0}
      totalPages={0}
      onPageChange={() => {}} // Empty function, ignored
      onRowsPerPageChange={() => {}} // Empty function, ignored
    />
  );
};

export default OrderTypesTable;
