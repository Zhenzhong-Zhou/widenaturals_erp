import type { FC } from 'react';
import DetailHeader from '@components/common/DetailHeader';
import type { MergedInventoryActivityLogEntry } from '@features/report/utils/logUtils';

interface LogHeaderProps {
  entry: MergedInventoryActivityLogEntry;
}

const LogHeader: FC<LogHeaderProps> = ({ entry }) => {
  const isProduct = !!entry?.productInfo;
  const isMaterial = !!entry?.packagingMaterialInfo;

  const name = isProduct
    ? (entry.productInfo?.productName ?? '—')
    : isMaterial
      ? (entry.packagingMaterialInfo?.snapshotName ?? '—')
      : '—';

  const subtitle = isProduct
    ? `Product • SKU: ${entry.productInfo?.sku ?? '—'}`
    : isMaterial
      ? `Packaging • Code: ${entry.packagingMaterialInfo?.code ?? '—'}`
      : `Batch Type: ${entry?.batchType ?? '-'}`;

  const avatarFallback = isProduct ? 'P' : isMaterial ? 'M' : '?';

  return (
    <DetailHeader
      name={name}
      subtitle={subtitle}
      avatarFallback={avatarFallback}
      sx={{ mt: 1 }}
    />
  );
};

export default LogHeader;
