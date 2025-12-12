import { Link } from 'react-router-dom';
import CardMedia from '@mui/material/CardMedia';
import type { Column } from '@components/common/CustomTable';
import TruncatedText from '@components/common/TruncatedText';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import { formatImageUrl } from '@utils/formatImageUrl';
import type { FlattenedSkuRecord } from '@features/sku/state';
import { NO_IMAGE_PLACEHOLDER } from '@utils/constants/assets';

/**
 * Returns column definitions for the SKU list table.
 * Includes:
 *  - Thumbnail image (primary image URL)
 *  - Product metadata
 *  - SKU metadata
 *  - Status
 *  - Drill-down expansion
 */
export const getSkuListTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedSkuRecord>[] => {
  const columns: Column<FlattenedSkuRecord>[] = [
    // ------------------------------
    // Thumbnail Image Column
    // ------------------------------
    {
      id: 'primaryImageUrl',
      label: 'Image',
      sortable: false, // Sorting by images is not meaningful
      align: 'center',
      renderCell: (row) => (
        <CardMedia
          component="img"
          image={row.primaryImageUrl
            ? formatImageUrl(row.primaryImageUrl)
            : NO_IMAGE_PLACEHOLDER}
          loading="lazy"
          alt={row.displayProductName ?? 'SKU image'}
          sx={{
            width: 50,
            height: 50,
            objectFit: 'cover',
            borderRadius: '4px',
            border: '1px solid #e0e0e0',
            backgroundColor: '#fafafa',
          }}
        />
      ),
    },
    
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
