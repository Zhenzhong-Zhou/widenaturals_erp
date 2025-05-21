import { type FC, memo } from 'react';
import type { Column } from '@components/common/CustomTable';
import CustomTable from '@components/common/CustomTable';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { LocationInventorySummaryItemDetail } from '@features/locationInventory/state';
import { generateUniqueKey } from '@utils/generateUniqueKey';

interface Props {
  data: LocationInventorySummaryItemDetail[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newLimit: number) => void;
}

const LocationInventorySummaryDetailTable: FC<Props> = ({
                                                          data,
                                                          page,
                                                          rowsPerPage,
                                                          totalRecords,
                                                          totalPages,
                                                          onPageChange,
                                                          onRowsPerPageChange,
                                                        }) => {
  const id = generateUniqueKey();
  
  const columns: Column<LocationInventorySummaryItemDetail>[] = [
    {
      id: 'locationType',
      label: 'Type',
      sortable: true,
      format: (_, row) => row?.location?.type ?? 'N/A',
    },
    {
      id: 'locationName',
      label: 'Location',
      sortable: true,
      format: (_, row) => row?.location?.name ?? 'N/A',
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
      format: (_, row) => formatDate(row?.expiryDate ?? null),
    },
    {
      id: 'expiryDate',
      label: 'Expiry Date',
      sortable: true,
      format: (_, row) => formatDate(row?.expiryDate ?? null),
    },
    {
      id: 'locationQuantity',
      label: 'Location Qty',
      sortable: true,
      format: (_, row) => row?.quantity.locationQuantity,
    },
    {
      id: 'reserved',
      label: 'Reserved',
      sortable: true,
      format: (_, row) => row?.quantity.reserved,
    },
    {
      id: 'available',
      label: 'Available',
      sortable: true,
      format: (_, row) => row?.quantity.available,
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
        row?.timestamps.lastUpdate ? formatDate(row.timestamps.lastUpdate) : '—',
    },
    {
      id: 'inboundDate',
      label: 'Inbound Date',
      sortable: true,
      format: (_, row) =>
        row?.timestamps.inboundDate ? formatDate(row.timestamps.inboundDate) : '—',
    },
    {
      id: 'outboundDate',
      label: 'Outbound Date',
      sortable: true,
      format: (_, row) =>
        row?.timestamps.outboundDate ? formatDate(row.timestamps.outboundDate) : '—',
    },
    {
      id: 'durationInStorage',
      label: 'Duration In Storage',
      sortable: true,
      format: (_, row) => `${row?.durationInStorage} days`,
    },
  ];
  
  return (
    <CustomTable
      rowsPerPageId={`rows-per-page-${id}`}
      columns={columns}
      data={data}
      page={page}
      initialRowsPerPage={rowsPerPage}
      totalRecords={totalRecords}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      emptyMessage="No location inventory detail available."
    />
  );
};

export default memo(LocationInventorySummaryDetailTable);
