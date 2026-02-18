import type { Column } from '@components/common/CustomTable';
import { TruncatedText } from '@components/index';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';
import type { FlattenedLocationTypeRecord } from '@features/locationType/state';

/**
 * Returns table column definitions for the Location Type list view.
 *
 * Columns are ordered by operational priority:
 * identity → description → status → audit → interaction.
 */
export const getLocationTypeTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedLocationTypeRecord>[] => {
  const columns: Column<FlattenedLocationTypeRecord>[] = [
    // --------------------------------------------------
    // Identity
    // --------------------------------------------------
    {
      id: 'name',
      label: 'Type Name',
      sortable: true,
      renderCell: (row) => (
        <TruncatedText
          text={row.name}
          maxLength={28}
          variant="body2"
          sx={{ fontWeight: 500 }}
        />
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
  ];

  // --------------------------------------------------
  // Drill-down
  // --------------------------------------------------
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedLocationTypeRecord>(
        (row) => onDrillDownToggle(row.id),
        (row) => expandedRowId === row.id
      )
    );
  }

  return columns;
};
