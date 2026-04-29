import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import { TruncatedText } from '@components/index';
import { formatLabel } from '@utils/textUtils';
import type { PricingTypeRecord } from '@features/pricingType';
import { formatDateTime } from '@utils/dateTimeUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';

/**
 * Returns table column definitions for the pricing type list view.
 *
 * Columns are ordered by operational priority:
 * identity → classification → status → audit → interaction.
 */
export const getPricingTypeTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<PricingTypeRecord>[] => {
  const columns: Column<PricingTypeRecord>[] = [
    // --------------------------------------------------
    // Identity
    // --------------------------------------------------
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      renderCell: (row) => (
        <Link to={`/pricing-types/${row.slug}/${row.id}`}>
          <TruncatedText
            text={row.name}
            maxLength={30}
            variant="body2"
            sx={{ fontWeight: 400 }}
          />
        </Link>
      ),
    },
    {
      id: 'code',
      label: 'Code',
      sortable: true,
      renderCell: (row) => row.code,
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
  ];
  
  // --------------------------------------------------
  // Drill-down
  // --------------------------------------------------
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<PricingTypeRecord>(
        (row) => onDrillDownToggle(row.id),
        (row) => expandedRowId === row.id
      )
    );
  }
  
  return columns;
};
