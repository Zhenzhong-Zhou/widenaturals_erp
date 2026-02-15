import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import TruncatedText from '@components/common/TruncatedText';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedBatchRegistryRecord } from '@features/batchRegistry/state';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils.ts';

/**
 * Returns table column definitions for the Batch Registry list view.
 *
 * Columns are ordered by operational priority:
 * identity → usability → context → audit → interaction.
 */
export const getBatchRegistryTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedBatchRegistryRecord>[] => {
  const columns: Column<FlattenedBatchRegistryRecord>[] = [
    // --------------------------------------------------
    // Identity
    // --------------------------------------------------
    {
      id: 'lotNumber',
      label: 'Lot Number',
      sortable: true,
      renderCell: (row) => (
        <Link to={'#'}>
          <TruncatedText
            text={row.lotNumber}
            maxLength={20}
            variant="body2"
            sx={{ fontWeight: 400 }}
          />
        </Link>
      ),
    },
    {
      id: 'batchType',
      label: 'Type',
      sortable: true,
      renderCell: (row) => formatLabel(row.batchType),
    },
    {
      id: 'entityName',
      label: 'Entity',
      sortable: false,
      renderCell: (row) => (
        <TruncatedText
          text={
            row.batchType === 'product'
              ? row.productName
              : row.packagingDisplayName
          }
          maxLength={20}
          variant="body2"
          sx={{ fontWeight: 400 }}
        />
      ),
    },

    // --------------------------------------------------
    // Usability
    // --------------------------------------------------
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.status),
    },
    {
      id: 'expiryDate',
      label: 'Expiry',
      sortable: true,
      renderCell: (row) => formatDate(row.expiryDate),
    },

    // --------------------------------------------------
    // Context
    // --------------------------------------------------
    {
      id: 'skuCode',
      label: 'SKU',
      sortable: true,
      renderCell: (row) =>
        row.batchType === 'product'
          ? (row.skuCode ?? '—')
          : (row.packagingMaterialCode ?? '—'),
    },
    {
      id: 'sourceName',
      label: 'Manufacturer / Supplier',
      sortable: true,
      renderCell: (row) => (
        <TruncatedText
          text={
            row.batchType === 'product'
              ? row.manufacturerName
              : row.supplierName
          }
          maxLength={20}
          variant="body2"
          sx={{ fontWeight: 400 }}
        />
      ),
    },

    // --------------------------------------------------
    // Audit
    // --------------------------------------------------
    {
      id: 'registeredAt',
      label: 'Registered At',
      sortable: true,
      renderCell: (row) => formatDateTime(row.registeredAt),
    },
    {
      id: 'registeredBy',
      label: 'Registered By',
      sortable: true,
      renderCell: (row) => row.registeredBy,
    },
  ];

  // --------------------------------------------------
  // Drill-down
  // --------------------------------------------------
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedBatchRegistryRecord>(
        (row) => onDrillDownToggle(row.id),
        (row) => expandedRowId === row.id
      )
    );
  }

  return columns;
};
