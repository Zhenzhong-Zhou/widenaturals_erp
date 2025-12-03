import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import TruncatedText from '@components/common/TruncatedText';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedSkuRecord } from '@features/sku/state';

/**
 * Returns column definitions for the SKU list table.
 *
 * Includes:
 *  - Product metadata (name, brand, category)
 *  - SKU metadata (code, region, size, barcode)
 *  - Status info
 *  - Audit fields
 *  - Optional drill-down column for row expansion
 *
 * @param expandedRowId - Currently expanded SKU row ID.
 * @param onDrillDownToggle - Optional callback to toggle row expansion.
 */
export const getSkuListTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedSkuRecord>[] => {
  const columns: Column<FlattenedSkuRecord>[] = [
    // ------------------------------
    // Product Info
    // ------------------------------
    {
      id: 'productName',
      label: 'Product',
      sortable: true,
      renderCell: (row) => (
        <Link to={`/skus/${row.skuId}`}>
          <TruncatedText
            text={row.displayProductName ?? '—'}
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

    // ------------------------------
    // SKU Info
    // ------------------------------
    {
      id: 'skuCode',
      label: 'SKU Code',
      sortable: true,
      renderCell: (row) => row.skuCode ?? '—',
    },
    {
      id: 'sizeLabel',
      label: 'Size',
      sortable: true,
      renderCell: (row) => row.sizeLabel ?? '—',
    },
    {
      id: 'barcode',
      label: 'Barcode',
      sortable: true,
      renderCell: (row) => row.barcode ?? '—',
    },
    {
      id: 'marketRegion',
      label: 'Region',
      sortable: true,
      renderCell: (row) => row.marketRegion ?? '—',
    },
    {
      id: 'language',
      label: 'Language',
      sortable: true,
      renderCell: (row) => row.language ?? '—',
    },

    // ------------------------------
    // Status Info
    // ------------------------------
    {
      id: 'statusName',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.statusName) ?? '—',
    },
  ];

  // ------------------------------
  // Drill-down Expansion Column
  // ------------------------------
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedSkuRecord>(
        (row) => onDrillDownToggle(row.skuId ?? ''),
        (row) => expandedRowId === row.skuId
      )
    );
  }

  return columns;
};
