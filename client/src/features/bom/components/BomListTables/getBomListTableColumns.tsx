import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import TruncatedText from '@components/common/TruncatedText';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedBomRecord } from '@features/bom/state';

/**
 * Returns table column definitions for the BOM list view.
 *
 * Includes product, SKU, and BOM metadata columns, with an optional
 * drill-down column for expandable row toggling.
 *
 * @param expandedRowId - The currently expanded BOM row ID.
 * @param onDrillDownToggle - Optional callback to toggle expansion.
 * @returns {Column<FlattenedBomRecord>[]} Array of column definitions.
 */
export const getBomListTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedBomRecord>[] => {
  const columns: Column<FlattenedBomRecord>[] = [
    // --- Product Info ---
    {
      id: 'productName',
      label: 'Product',
      sortable: true,
      renderCell: (row) => (
        <Link
          to={`/boms/${row.bomId}`}
        >
          <TruncatedText
            text={row.productName ?? '—'}
            maxLength={35}
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

    // --- SKU Info ---
    {
      id: 'skuCode',
      label: 'SKU Code',
      sortable: true,
      renderCell: (row) => row.skuCode ?? '—',
    },
    {
      id: 'marketRegion',
      label: 'Region',
      sortable: true,
      renderCell: (row) => row.marketRegion ?? '—',
    },

    // --- BOM Info ---
    {
      id: 'bomName',
      label: 'BOM Name',
      sortable: true,
      renderCell: (row) => (
        <TruncatedText
          text={row.bomName ?? '—'}
          maxLength={15}
          variant="body2"
          sx={{
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        />
      ),
    },
    {
      id: 'revision',
      label: 'Rev',
      sortable: true,
      renderCell: (row) => row.revision ?? '—',
    },
    {
      id: 'isDefault',
      label: 'Default',
      sortable: true,
      renderCell: (row) => (row.isDefault ? 'Yes' : 'No'),
    },
    {
      id: 'isActive',
      label: 'Active',
      sortable: true,
      renderCell: (row) => (row.isActive ? 'Yes' : 'No'),
    },

    // --- Status Info ---
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.status) ?? '—',
    },
  ];
  
  // --- Optional drill-down column for expandable rows ---
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedBomRecord>(
        (row) => onDrillDownToggle(row.bomId ?? ''),
        (row) => expandedRowId === row.bomId
      )
    );
  }
  
  return columns;
};
