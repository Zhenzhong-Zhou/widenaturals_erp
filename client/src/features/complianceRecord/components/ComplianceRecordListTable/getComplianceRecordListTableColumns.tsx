import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import TruncatedText from '@components/common/TruncatedText';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import type { ComplianceRecordTableRow } from '@features/complianceRecord/state';
import { formatDate } from '@utils/dateTimeUtils';

/**
 * Returns column definitions for the Compliance Records list table.
 *
 * Includes:
 *  - Compliance metadata
 *  - Product & SKU references
 *  - Status
 *  - Audit information
 *  - Optional drill-down expansion
 */
export const getComplianceRecordListTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<ComplianceRecordTableRow>[] => {
  const columns: Column<ComplianceRecordTableRow>[] = [
    // --------------------------------------------------
    // Product Info
    // --------------------------------------------------
    {
      id: 'productName',
      label: 'Product',
      sortable: true,
      renderCell: (row) => (
        <TruncatedText
          text={row.productDisplayName || row.productName || '—'}
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
    
    // --------------------------------------------------
    // SKU Info
    // --------------------------------------------------
    {
      id: 'skuCode',
      label: 'SKU',
      sortable: true,
      renderCell: (row) => row.skuCode ?? '—',
    },
    {
      id: 'marketRegion',
      label: 'Region',
      sortable: true,
      renderCell: (row) => row.marketRegion ?? '—',
    },
    
    // --------------------------------------------------
    // Compliance Info
    // --------------------------------------------------
    {
      id: 'documentNumber',
      label: 'Compliance #',
      sortable: true,
      renderCell: (row) => (
        <Link to={`/compliance-records/${row.id}`}>
          <TruncatedText
            text={row.documentNumber ?? '—'}
            maxLength={20}
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
      id: 'type',
      label: 'Type',
      sortable: true,
      renderCell: (row) => row.type ?? '—',
    },
    {
      id: 'issuedDate',
      label: 'Issued Date',
      sortable: true,
      renderCell: (row) =>
        row.issuedDate
          ? formatDate(row.issuedDate)
          : '—',
    },
    
    // --------------------------------------------------
    // Status
    // --------------------------------------------------
    {
      id: 'statusName',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.statusName) ?? '—',
    },
    
    // --------------------------------------------------
    // Audit
    // --------------------------------------------------
    {
      id: 'createdAt',
      label: 'Created',
      sortable: true,
      renderCell: (row) =>
        row.createdAt
          ? formatDate(row.createdAt)
          : '—',
    },
    {
      id: 'createdByName',
      label: 'Created By',
      sortable: false,
      renderCell: (row) => formatLabel(row.createdByName) ?? '—',
    },
  ];
  
  // --------------------------------------------------
  // Drill-down Expansion Column
  // --------------------------------------------------
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<ComplianceRecordTableRow>(
        (row) => onDrillDownToggle(row.skuId),
        (row) => expandedRowId === row.skuId
      )
    );
  }
  
  return columns;
};
