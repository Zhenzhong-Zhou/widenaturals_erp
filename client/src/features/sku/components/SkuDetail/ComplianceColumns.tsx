import { formatToISODate, formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { MiniColumn } from '@components/common/CustomMiniTable';
import type { FlattenedComplianceRecord } from '@features/sku/state';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import { type ActionConfig } from '@utils/table/renderActionIcons';
import { buildActionColumn } from '@utils/table/buildActionColumn';

export const createComplianceColumns = (
  onAuditClick: (row: FlattenedComplianceRecord, target: HTMLElement) => void,
  onDescriptionClick: (
    row: FlattenedComplianceRecord,
    target: HTMLElement
  ) => void
): MiniColumn<FlattenedComplianceRecord>[] => [
  { id: 'type', label: 'Type' },
  { id: 'complianceId', label: 'Compliance Number' },
  {
    id: 'issuedDate',
    label: 'Issued',
    format: (value) => formatToISODate(value),
  },
  {
    id: 'expiryDate',
    label: 'Expiry',
    format: (value) => formatToISODate(value),
  },
  {
    id: 'status',
    label: 'Status',
    format: (value) => formatLabel(value),
  },
  {
    id: 'statusDate',
    label: 'Status Date',
    format: (value) => formatDateTime(value),
  },
  buildActionColumn<FlattenedComplianceRecord>(
    (row) =>
      [
        row.description && {
          key: 'desc',
          title: 'View Description',
          icon: <DescriptionIcon fontSize="small" />,
          onClick: onDescriptionClick,
        },

        (row.createdBy || row.updatedBy) && {
          key: 'audit',
          title: 'View Audit',
          icon: <InfoOutlinedIcon fontSize="small" />,
          onClick: onAuditClick,
        },
      ].filter(Boolean) as ActionConfig<FlattenedComplianceRecord>[]
  ),
];
