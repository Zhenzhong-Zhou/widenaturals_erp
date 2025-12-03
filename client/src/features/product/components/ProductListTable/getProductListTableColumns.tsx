import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import TruncatedText from '@components/common/TruncatedText';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedProductRecord } from '@features/product/state/productTypes';
import { formatDateTime } from '@utils/dateTimeUtils.ts';

/**
 * Returns column definitions for the Product list table.
 *
 * Includes:
 * - Product metadata (name, brand, category, series)
 * - Status info
 * - Audit fields
 * - Optional drill-down column for row expansion
 *
 * @param expandedRowId - Currently expanded product row ID.
 * @param onDrillDownToggle - Optional callback to toggle row expansion.
 */
export const getProductListTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedProductRecord>[] => {
  const columns: Column<FlattenedProductRecord>[] = [
    // ------------------------------
    // Product Info
    // ------------------------------
    {
      id: 'name',
      label: 'Product',
      sortable: true,
      renderCell: (row) => (
        <Link to={`/products/${row.productId}`}>
          <TruncatedText
            text={row.name ?? '—'}
            maxLength={30}
            variant="body2"
            sx={{
              color: '#1976D2',
              fontWeight: 'bold',
              '&:hover': { textDecoration: 'underline' },
            }}
          />
        </Link>
      ),
    },
    {
      id: 'brand',
      label: 'Brand',
      sortable: true,
      renderCell: (row) => row.brand ?? '—',
    },
    {
      id: 'category',
      label: 'Category',
      sortable: true,
      renderCell: (row) => row.category ?? '—',
    },
    {
      id: 'series',
      label: 'Series',
      sortable: true,
      renderCell: (row) => row.series ?? '—',
    },

    // ------------------------------
    // Status Info
    // ------------------------------
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.statusName) ?? '—',
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      sortable: true,
      renderCell: (row) => formatDateTime(row.statusDate) ?? '—',
    },
  ];

  // ------------------------------
  // Drill-down Expansion Column
  // ------------------------------
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedProductRecord>(
        (row) => onDrillDownToggle(row.productId),
        (row) => expandedRowId === row.productId
      )
    );
  }

  return columns;
};
