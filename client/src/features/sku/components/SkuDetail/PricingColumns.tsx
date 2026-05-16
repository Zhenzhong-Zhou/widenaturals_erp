import { formatCurrency, formatLabel } from '@utils/textUtils';
import { formatToISODate } from '@utils/dateTimeUtils';
import type { MiniColumn } from '@components/common/CustomMiniTable';
import type { FlattenedPricingRecord } from '@features/sku/state';
import { buildActionColumn } from '@utils/table/buildActionColumn';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { ActionConfig } from '@utils/table/renderActionIcons';

/**
 * Build the MiniTable column definitions for the SKU detail pricing table.
 *
 * The action column always renders a "View Metadata" icon and conditionally
 * renders a "View Audit" icon — the latter only when the row carries real
 * audit data (pricing entries the user lacks audit visibility for arrive
 * with all four audit fields null).
 *
 * @param onMetadataClick Handler for the metadata icon
 * @param onAuditClick Handler for the audit icon
 */
export const createPricingColumns = (
  onMetadataClick: (row: FlattenedPricingRecord, target: HTMLElement) => void,
  onAuditClick: (row: FlattenedPricingRecord, target: HTMLElement) => void
): MiniColumn<FlattenedPricingRecord>[] => [
  { id: 'pricingTypeName', label: 'Price Type', format: (v) => formatLabel(v) },
  { id: 'countryCode', label: 'Country' },
  {
    id: 'price',
    label: 'Price',
    format: (v) => formatCurrency(v),
  },
  {
    id: 'validFrom',
    label: 'Valid From',
    format: (v) => formatToISODate(v),
  },
  {
    id: 'validTo',
    label: 'Valid To',
    format: (v) => formatToISODate(v),
  },
  {
    id: 'statusName',
    label: 'Status',
    format: (value) => formatLabel(value),
  },
  buildActionColumn<FlattenedPricingRecord>((row) =>
    [
      {
        key: 'meta',
        title: 'View Metadata',
        icon: <ArticleOutlinedIcon fontSize="small" />,
        onClick: onMetadataClick,
      },
      hasAuditData(row) && {
        key: 'audit',
        title: 'View Audit',
        icon: <InfoOutlinedIcon fontSize="small" />,
        onClick: onAuditClick,
      },
    ].filter(Boolean) as ActionConfig<FlattenedPricingRecord>[]
  ),
];

/**
 * Whether a flattened pricing row carries any audit data.
 *
 * Gates the audit icon in the action column. Rows where ACL stripped
 * the audit block from the backend arrive with all four audit fields
 * null and should not surface the icon.
 */
const hasAuditData = (row: FlattenedPricingRecord) =>
  Boolean(
    (row.createdBy && row.createdBy !== '—') ||
    (row.updatedBy && row.updatedBy !== '—') ||
    row.createdAt ||
    row.updatedAt
  );
