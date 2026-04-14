import type { Column } from '@components/common/CustomTable';
import TruncatedText from '@components/common/TruncatedText';
import { formatLabel } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import type { FlattenedPricingJoinRecord } from '@features/pricing';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';

/**
 * Returns column definitions for the Pricing join list table.
 *
 * Includes:
 * - Pricing type info (name, code)
 * - Geography (country code)
 * - Price and validity range
 * - SKU info (sku, barcode, size label, SKU country code)
 * - Product info (name, brand, category)
 * - Status info
 *
 * @returns Column definitions for the pricing list table.
 */
export const getPricingListTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedPricingJoinRecord>[] => {
  const columns: Column<FlattenedPricingJoinRecord>[] = [
    // ------------------------------
    // Product Info
    // ------------------------------
    {
      id: 'productName',
      label: 'Product',
      sortable: true,
      renderCell: (row) => (
        <TruncatedText
          text={row.displayName ?? '—'}
          maxLength={30}
          variant="body2"
        />
      ),
    },
    {
      id: 'brand',
      label: 'Brand',
      sortable: true,
      renderCell: (row) => row.brand ?? '—',
    },
    
    // ------------------------------
    // SKU Info
    // ------------------------------
    {
      id: 'barcode',
      label: 'Barcode',
      sortable: true,
      renderCell: (row) => row.barcode ?? '—',
    },
    
    // ------------------------------
    // Pricing Type
    // ------------------------------
    {
      id: 'pricingTypeName',
      label: 'Pricing Type',
      sortable: true,
      renderCell: (row) => row.pricingTypeName ?? '—',
    },
    
    // ------------------------------
    // Geography & Price
    // ------------------------------
    {
      id: 'countryCode',
      label: 'Country',
      sortable: true,
      renderCell: (row) => row.countryCode ?? '—',
    },
    {
      id: 'price',
      label: 'Price',
      sortable: true,
      renderCell: (row) =>
        row.price != null ? `$${row.price.toFixed(2)}` : '—',
    },
    
    // ------------------------------
    // Validity
    // ------------------------------
    {
      id: 'validFrom',
      label: 'Valid From',
      sortable: true,
      renderCell: (row) => formatDate(row.validFrom) ?? '—',
    },
    {
      id: 'validTo',
      label: 'Valid To',
      sortable: true,
      renderCell: (row) => formatDate(row.validTo) ?? 'N/A',
    },
    
    // ------------------------------
    // Status
    // ------------------------------
    {
      id: 'statusName',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.statusName) ?? '—',
    },
  ];
  
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedPricingJoinRecord>(
        (row) => onDrillDownToggle(row.pricingId),
        (row) => expandedRowId === row.pricingId
      )
    );
  }
  
  return columns;
};