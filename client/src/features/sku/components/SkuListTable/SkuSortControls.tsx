import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { SkuSortField } from '@features/sku/state/skuTypes';

interface SkuSortControlsProps {
  sortBy: SkuSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: SkuSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const skuSortOptions: { label: string; value: SkuSortField }[] = [
  // ---- SKU-level fields ----
  { label: 'SKU Code', value: 'skuCode' },
  { label: 'Barcode', value: 'barcode' },
  { label: 'Language', value: 'language' },
  { label: 'Country Code', value: 'countryCode' },
  { label: 'Market Region', value: 'marketRegion' },
  { label: 'Size Label', value: 'sizeLabel' },
  
  // ---- Product-level fields ----
  { label: 'Product Name', value: 'productName' },
  { label: 'Product Series', value: 'productSeries' },
  { label: 'Brand', value: 'brand' },
  { label: 'Category', value: 'category' },
  
  // ---- Status fields ----
  { label: 'Status Name', value: 'statusName' },
  { label: 'Status Date', value: 'statusDate' },
  
  // ---- Audit fields ----
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  
  // ---- Default fallback ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

const SkuSortControls: FC<SkuSortControlsProps> = ({
                                                     sortBy,
                                                     sortOrder,
                                                     onSortByChange,
                                                     onSortOrderChange,
                                                   }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={skuSortOptions}
      onSortByChange={(val) => onSortByChange(val as SkuSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default SkuSortControls;
