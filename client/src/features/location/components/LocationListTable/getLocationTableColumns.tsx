import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import { TruncatedText } from '@components/index';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';
import type { FlattenedLocationListRecord } from '@features/location/state';

/**
 * Returns table column definitions for the Location list view.
 *
 * Columns are ordered by operational priority:
 * identity → classification → geography → status → audit → interaction.
 */
export const getLocationTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedLocationListRecord>[] => {
  const columns: Column<FlattenedLocationListRecord>[] = [
    // --------------------------------------------------
    // Identity
    // --------------------------------------------------
    {
      id: 'name',
      label: 'Location Name',
      sortable: true,
      renderCell: (row) => (
        <Link to="#">
          <TruncatedText
            text={row.name}
            maxLength={24}
            variant="body2"
            sx={{ fontWeight: 500 }}
          />
        </Link>
      ),
    },
    
    // --------------------------------------------------
    // Classification
    // --------------------------------------------------
    {
      id: 'locationType',
      label: 'Type',
      sortable: true,
      renderCell: (row) => formatLabel(row.locationType),
    },
    
    // --------------------------------------------------
    // Geography
    // --------------------------------------------------
    {
      id: 'city',
      label: 'City',
      sortable: true,
      renderCell: (row) => formatLabel(row.city ?? '—'),
    },
    {
      id: 'provinceOrState',
      label: 'Province / State',
      sortable: true,
      renderCell: (row) => row.provinceOrState ?? '—',
    },
    {
      id: 'country',
      label: 'Country',
      sortable: true,
      renderCell: (row) => formatLabel(row.country ?? '—'),
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
    
    // --------------------------------------------------
    // Archive
    // --------------------------------------------------
    {
      id: 'isArchived',
      label: 'Archived',
      sortable: true,
      renderCell: (row) => (row.isArchived ? 'Yes' : 'No'),
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
      renderCell: (row) =>formatLabel(row.createdByName ?? '—'),
    },
  ];
  
  // --------------------------------------------------
  // Drill-down
  // --------------------------------------------------
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedLocationListRecord>(
        (row) => onDrillDownToggle(row.id),
        (row) => expandedRowId === row.id
      )
    );
  }
  
  return columns;
};
