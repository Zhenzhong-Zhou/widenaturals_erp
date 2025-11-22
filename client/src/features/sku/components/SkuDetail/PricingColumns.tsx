import { formatCurrency, formatLabel } from '@utils/textUtils';
import { formatToISODate } from '@utils/dateTimeUtils';
import type { MiniColumn } from '@components/common/CustomMiniTable';
import type { FlattenedPricingRecord } from '@features/sku/state';
import { buildActionColumn } from '@utils/table/buildActionColumn';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { ActionConfig } from '@utils/table/renderActionIcons';

export const createPricingColumns = (
  onMetadataClick: (row: FlattenedPricingRecord, target: HTMLElement) => void,
  onAuditClick: (row: FlattenedPricingRecord, target: HTMLElement) => void,
): MiniColumn<FlattenedPricingRecord>[] => [
  { id: 'priceType', label: 'Price Type' },
  { id: 'locationName', label: 'Location' },
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
    id: 'status',
    label: 'Status',
    format: (value) => formatLabel(value),
  },
  buildActionColumn<FlattenedPricingRecord>((row) => [
    {
      key: "meta",
      title: "View Metadata",
      icon: <ArticleOutlinedIcon fontSize="small" />,
      onClick: onMetadataClick,
    },
    (row.createdBy || row.updatedBy) && {
      key: "audit",
      title: "View Audit",
      icon: <InfoOutlinedIcon fontSize="small" />,
      onClick: onAuditClick,
    },
  ].filter(Boolean) as ActionConfig<FlattenedPricingRecord>[]),
];
