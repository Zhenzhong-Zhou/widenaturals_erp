import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import { TruncatedText } from '@components/index';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedProductBatchRecord } from '@features/productBatch/state';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';

/**
 * Returns table column definitions for the Product Batch list view.
 *
 * Columns are ordered by operational priority:
 * identity → usability → context → audit → interaction.
 */
export const getProductBatchTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedProductBatchRecord>[] => {
  const columns: Column<FlattenedProductBatchRecord>[] = [
    // --------------------------------------------------
    // Identity
    // --------------------------------------------------
    {
      id: 'lotNumber',
      label: 'Lot Number',
      sortable: true,
      renderCell: (row) => (
        <Link to="#">
          <TruncatedText
            text={row.lotNumber}
            maxLength={20}
            variant="body2"
            sx={{ fontWeight: 400 }}
          />
        </Link>
      ),
    },

    // --------------------------------------------------
    // Product context
    // --------------------------------------------------
    {
      id: 'productDisplayName',
      label: 'Product',
      sortable: true,
      renderCell: (row) => (
        <TruncatedText
          text={row.productDisplayName}
          maxLength={20}
          variant="body2"
          sx={{ fontWeight: 400 }}
        />
      ),
    },
    {
      id: 'skuCode',
      label: 'SKU',
      sortable: true,
      renderCell: (row) => row.skuCode ?? '—',
    },
    {
      id: 'manufacturerName',
      label: 'Manufacturer',
      sortable: true,
      renderCell: (row) => (
        <TruncatedText
          text={row.manufacturerName}
          maxLength={20}
          variant="body2"
          sx={{ fontWeight: 400 }}
        />
      ),
    },

    // --------------------------------------------------
    // Lifecycle (time-critical)
    // --------------------------------------------------
    {
      id: 'manufactureDate',
      label: 'MFG Date',
      sortable: true,
      renderCell: (row) => formatDate(row.manufactureDate),
    },
    {
      id: 'receivedDate',
      label: 'Received Date',
      sortable: true,
      renderCell: (row) => formatDate(row.receivedDate),
    },
    {
      id: 'expiryDate',
      label: 'Expiry',
      sortable: true,
      renderCell: (row) => formatDate(row.expiryDate),
    },

    // --------------------------------------------------
    // Quantity
    // --------------------------------------------------
    {
      id: 'initialQuantity',
      label: 'Initial Qty',
      sortable: true,
      renderCell: (row) => row.initialQuantity,
    },

    // --------------------------------------------------
    // Status & release
    // --------------------------------------------------
    {
      id: 'statusName',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.statusName),
    },
    {
      id: 'releasedAt',
      label: 'Released At',
      sortable: true,
      renderCell: (row) => formatDateTime(row.releasedAt),
    },
  ];

  // --------------------------------------------------
  // Drill-down
  // --------------------------------------------------
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedProductBatchRecord>(
        (row) => onDrillDownToggle(row.id),
        (row) => expandedRowId === row.id
      )
    );
  }

  return columns;
};
