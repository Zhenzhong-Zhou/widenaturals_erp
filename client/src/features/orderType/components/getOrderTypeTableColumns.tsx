import Tooltip from '@mui/material/Tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import type { Column } from '@components/common/CustomTable';
import type { FlattenedOrderTypeRecord } from '@features/orderType/state';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';

/**
 * Returns column definitions for the Order Types table.
 *
 * Extracted as a factory function to:
 * - avoid column re-creation in render cycles
 * - keep table configuration isolated and reusable
 * - allow future extension (permissions, actions, feature flags)
 */
export const getOrderTypeTableColumns = (): Column<FlattenedOrderTypeRecord>[] => [
  {
    id: 'name',
    label: 'Order Type',
    minWidth: 170,
    sortable: true,
    format: (value) => formatLabel(String(value)),
  },
  {
    id: 'code',
    label: 'Code',
    minWidth: 150,
    sortable: true,
  },
  {
    id: 'category',
    label: 'Category',
    minWidth: 150,
    sortable: true,
    format: (value) => formatLabel(String(value)),
  },
  {
    id: 'requiresPayment',
    label: 'Requires Payment',
    sortable: true,
    renderCell: (row) => {
      const requiresPayment = row.requiresPayment;
      
      return (
        <Tooltip
          title={requiresPayment ? 'Payment required' : 'No payment required'}
        >
          <span>
            <FontAwesomeIcon
              icon={requiresPayment ? faCheckCircle : faTimesCircle}
              color={requiresPayment ? 'green' : 'gray'}
            />
          </span>
        </Tooltip>
      );
    },
  },
  {
    id: 'statusName',
    label: 'Status',
    minWidth: 100,
    sortable: true,
    format: (value) => formatLabel(String(value)),
  },
  {
    id: 'statusDate',
    label: 'Status Date',
    minWidth: 100,
    sortable: true,
    format: (value) =>
      value ? formatDateTime(String(value)) : '—',
  },
  {
    id: 'createdAt',
    label: 'Created At',
    minWidth: 100,
    sortable: true,
    format: (value) =>
      value ? formatDateTime(String(value)) : '—',
  },
  {
    id: 'createdBy',
    label: 'Created By',
    minWidth: 150,
    sortable: true,
  },
  {
    id: 'updatedBy',
    label: 'Updated By',
    minWidth: 150,
    sortable: true,
  },
  {
    id: 'updatedAt',
    label: 'Updated At',
    minWidth: 100,
    sortable: true,
    format: (value) =>
      value ? formatDateTime(String(value)) : '—',
  },
];
