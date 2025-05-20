import { type FC } from 'react';
import type { Column } from '@components/common/CustomTable';
import CustomTable from '@components/common/CustomTable';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { WarehouseInventorySummaryItemDetails } from '@features/warehouseInventory/state';

interface Props {
  data: WarehouseInventorySummaryItemDetails[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newLimit: number) => void;
}

const WarehouseInventorySummaryDetailTable: FC<Props> = ({
                                                           data,
                                                           page,
                                                           rowsPerPage,
                                                           totalRecords,
                                                           totalPages,
                                                           onPageChange,
                                                           onRowsPerPageChange,
                                                         }) => {
  const columns: Column<WarehouseInventorySummaryItemDetails>[] = [
    {
      id: 'warehouseName',
      label: 'Warehouse',
      sortable: true,
      format: (_, row) => row?.warehouse?.name ?? 'N/A',
    },
    {
      id: 'skuOrMaterial',
      label: 'Item Code',
      sortable: true,
      format: (_, row) => row?.item?.code ?? '—',
    },
    {
      id: 'lotNumber',
      label: 'Lot Number',
      sortable: true,
    },
    {
      id: 'manufactureDate',
      label: 'MFG Date',
      sortable: true,
      format: (_, row) => formatDate(row?.manufactureDate ?? null),
    },
    {
      id: 'expiryDate',
      label: 'Expiry Date',
      sortable: true,
      format: (_, row) => formatDate(row?.expiryDate ?? null),
    },
    {
      id: 'warehouseQuantity',
      label: 'WH Qty',
      sortable: true,
      format: (_, row) => row?.quantity?.warehouseQuantity ?? 0,
    },
    {
      id: 'reservedQuantity',
      label: 'Reserved',
      sortable: true,
      format: (_, row) => row?.quantity?.reserved ?? 0,
    },
    {
      id: 'availableQuantity',
      label: 'Available',
      sortable: true,
      format: (_, row) => row?.quantity?.available ?? 0,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: false,
      format: (_, row) => formatLabel(row?.status?.name ?? 'Unknown'),
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      sortable: true,
      format: (_, row) =>
        row?.status?.date ? formatDate(row?.status?.date) : '-',
    },
    {
      id: 'lastUpdate',
      label: 'Last Updated',
      sortable: true,
      format: (_, row) =>
        row?.timestamps.lastUpdate ? formatDate(row.timestamps.lastUpdate) : '—'
    },
  ];
  
  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      initialRowsPerPage={rowsPerPage}
      totalRecords={totalRecords}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      emptyMessage="No warehouse inventory detail available."
    />
  );
};

export default WarehouseInventorySummaryDetailTable;
