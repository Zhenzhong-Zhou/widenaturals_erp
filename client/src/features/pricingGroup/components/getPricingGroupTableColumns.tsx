import type { Column } from '@components/common/CustomTable';
import { TruncatedText } from '@components/index';
import { formatCurrency, formatLabel } from '@utils/textUtils';
import type { PricingGroupRecord } from '@features/pricingGroup';
import { formatDateTime } from '@utils/dateTimeUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';

/**
 * Returns table column definitions for the pricing group list view.
 *
 * Columns are ordered by operational priority:
 * identity → pricing → validity → status → counts.
 *
 * @param showPricingType   - When false, omits the pricing type name and code columns.
 *                            Set to false when rendered inside the pricing type detail page
 *                            where the type is already the page header.
 * @param expandedRowId     - ID of the currently expanded row, used to highlight the active drill-down.
 * @param onDrillDownToggle - Callback to toggle the expanded row. When provided, appends a drill-down column.
 */
export const getPricingGroupTableColumns = (
  showPricingType = true,
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void,
): Column<PricingGroupRecord>[] => {
  const columns: Column<PricingGroupRecord>[] = [];
  
  // --------------------------------------------------
  // Identity
  // --------------------------------------------------
  if (showPricingType) {
    columns.push(
      {
        id: 'pricingTypeName',
        label: 'Pricing Type',
        sortable: true,
        renderCell: (row) => (
          <TruncatedText
            text={row.pricingTypeName}
            maxLength={30}
            variant="body2"
            sx={{ fontWeight: 400 }}
          />
        ),
      },
      {
        id: 'pricingTypeCode',
        label: 'Code',
        sortable: true,
        renderCell: (row) => row.pricingTypeCode,
      }
    );
  }
  
  columns.push(
    {
      id: 'countryCode',
      label: 'Country',
      sortable: true,
      renderCell: (row) => row.countryCode,
    },
    
    // --------------------------------------------------
    // Pricing
    // --------------------------------------------------
    {
      id: 'price',
      label: 'Price',
      sortable: true,
      renderCell: (row) => formatCurrency(row.price),
    },
    
    // --------------------------------------------------
    // Validity
    // --------------------------------------------------
    {
      id: 'validFrom',
      label: 'Valid From',
      sortable: true,
      renderCell: (row) => formatDateTime(row.validFrom),
    },
    {
      id: 'validTo',
      label: 'Valid To',
      sortable: true,
      renderCell: (row) => row.validTo ? formatDateTime(row.validTo) : '—',
    },
    
    // --------------------------------------------------
    // Status
    // --------------------------------------------------
    {
      id: 'statusName',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.status.name),
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      sortable: true,
      renderCell: (row) => formatDateTime(row.status.date),
    },
    
    // --------------------------------------------------
    // Counts
    // --------------------------------------------------
    {
      id: 'skuCount',
      label: 'SKUs',
      sortable: true,
      renderCell: (row) => row.skuCount,
    },
    {
      id: 'productCount',
      label: 'Products',
      sortable: true,
      renderCell: (row) => row.productCount,
    }
  );
  
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<PricingGroupRecord>(
        (row) => onDrillDownToggle(row.id),
        (row) => expandedRowId === row.id
      )
    );
  }
  
  return columns;
};
