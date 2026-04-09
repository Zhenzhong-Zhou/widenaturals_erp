import { Link } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { CustomerListItem } from '@features/customer/state/customerTypes';
import type { Column } from '@components/common/CustomTable';
import { formatLabel, formatPhoneNumber } from '@utils/textUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatDateTime } from '@utils/dateTimeUtils';

export const getCustomersTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<CustomerListItem>[] => {
  const base: Column<CustomerListItem>[] = [
    {
      id: 'customerType',
      label: 'Customer Type',
      sortable: true,
      format: (value) =>
        typeof value === 'string' ? formatLabel(value) : 'Unknown',
    },
    {
      id: 'customerName',
      label: 'Customer Name',
      sortable: true,
      renderCell: (row) => (
        <Link
          to={`/customers/customer/${row.id}`}
          style={{
            textDecoration: 'none',
            color: '#1976D2',
            fontWeight: 'bold',
          }}
        >
          {row.customerName}
        </Link>
      ),
    },
    { id: 'email', label: 'Email', sortable: true },
    {
      id: 'phoneNumber',
      label: 'Phone',
      sortable: true,
      format: (value) =>
        typeof value === 'string' ? formatPhoneNumber(value) : 'Unknown',
    },
    {
      id: 'statusName',
      label: 'Status',
      sortable: false,
      format: (value) =>
        typeof value === 'string' ? formatLabel(value) : 'Unknown',
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      sortable: false,
      format: (value) =>
        typeof value === 'string' ? formatDateTime(value) : 'Unknown',
    },
    {
      id: 'hasAddress',
      label: 'Has Address',
      sortable: true,
      renderCell: (row) =>
        row.hasAddress ? (
          <CheckCircleIcon color="success" fontSize="small" />
        ) : (
          <CancelIcon color="disabled" fontSize="small" />
        ),
    },
  ];
  
  if (onDrillDownToggle) {
    base.push(
      createDrillDownColumn<CustomerListItem>(
        (row) => onDrillDownToggle(row.id),
        (row) => expandedRowId === row.id
      )
    );
  }
  return base;
};
