import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import { TruncatedText } from '@components/index';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import type { FlattenedPackagingMaterialBatchRow } from '@features/packagingMaterialBatch/state';

/**
 * Returns table column definitions for the Packaging Material Batch list view.
 *
 * Column order reflects operational priority:
 * identity → material → supplier → lifecycle → quantity/cost → status → audit → interaction.
 */
export const getPackagingMaterialBatchTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedPackagingMaterialBatchRow>[] => {
  const columns: Column<FlattenedPackagingMaterialBatchRow>[] = [
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
    // Material context
    // --------------------------------------------------
    {
      id: 'materialInternalName',
      label: 'Material',
      sortable: true,
      renderCell: (row) => (
        <TruncatedText
          text={row.materialInternalName}
          maxLength={25}
          variant="body2"
          sx={{ fontWeight: 400 }}
        />
      ),
    },
    {
      id: 'packagingMaterialCode',
      label: 'Code',
      sortable: true,
      renderCell: (row) => row.packagingMaterialCode ?? '—',
    },
    {
      id: 'packagingMaterialCategory',
      label: 'Category',
      sortable: true,
      renderCell: (row) => formatLabel(row.packagingMaterialCategory),
    },

    // --------------------------------------------------
    // Supplier
    // --------------------------------------------------
    {
      id: 'supplierName',
      label: 'Supplier',
      sortable: true,
      renderCell: (row) => (
        <TruncatedText
          text={row.supplierName}
          maxLength={20}
          variant="body2"
          sx={{ fontWeight: 400 }}
        />
      ),
    },
    {
      id: 'isPreferredSupplier',
      label: 'Preferred',
      sortable: true,
      renderCell: (row) => (row.isPreferredSupplier ? 'Yes' : 'No'),
    },
    {
      id: 'supplierLeadTimeDays',
      label: 'Lead Time (Days)',
      sortable: true,
      renderCell: (row) => row.supplierLeadTimeDays ?? '—',
    },

    // --------------------------------------------------
    // Lifecycle
    // --------------------------------------------------
    {
      id: 'manufactureDate',
      label: 'MFG Date',
      sortable: true,
      renderCell: (row) => formatDate(row.manufactureDate),
    },
    {
      id: 'receivedAt',
      label: 'Received',
      sortable: true,
      renderCell: (row) => formatDateTime(row.receivedAt),
    },
    {
      id: 'expiryDate',
      label: 'Expiry',
      sortable: true,
      renderCell: (row) => formatDate(row.expiryDate),
    },

    // --------------------------------------------------
    // Quantity & Cost
    // --------------------------------------------------
    {
      id: 'quantityValue',
      label: 'Quantity',
      sortable: true,
      renderCell: (row) => `${row.quantityValue} ${row.quantityUnit ?? ''}`,
    },
    {
      id: 'unitCost',
      label: 'Unit Cost',
      sortable: true,
      renderCell: (row) => `${row.currency ?? ''} ${row.unitCost ?? '0'}`,
    },
    {
      id: 'totalCost',
      label: 'Total Cost',
      sortable: true,
      renderCell: (row) => `${row.currency ?? ''} ${row.totalCost ?? '0'}`,
    },

    // --------------------------------------------------
    // Status
    // --------------------------------------------------
    {
      id: 'statusName',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.statusName),
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      sortable: true,
      renderCell: (row) => formatDateTime(row.statusDate),
    },

    // --------------------------------------------------
    // Audit
    // --------------------------------------------------
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      renderCell: (row) => formatDateTime(row.createdAt),
    },
    {
      id: 'createdByName',
      label: 'Created By',
      sortable: true,
      renderCell: (row) => row.createdByName ?? '—',
    },
  ];

  // --------------------------------------------------
  // Drill-down
  // --------------------------------------------------
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedPackagingMaterialBatchRow>(
        (row) => onDrillDownToggle(row.id),
        (row) => expandedRowId === row.id
      )
    );
  }

  return columns;
};
