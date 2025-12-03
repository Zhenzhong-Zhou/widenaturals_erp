import type { FC } from 'react';
import type { SkuProductCardSortField } from '@features/sku/state';
import type { SortOrder } from '@shared-types/api';
import SortControls from '@components/common/SortControls';

interface SkuProductSortControlsProps {
  sortBy: SkuProductCardSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: SkuProductCardSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const skuProductSortOptions: {
  label: string;
  value: SkuProductCardSortField;
}[] = [
  { label: 'Brand', value: 'brand' },
  { label: 'Category', value: 'category' },
  { label: 'Market Region', value: 'marketRegion' },
  { label: 'Size Label', value: 'sizeLabel' },
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

const ProductCatalogCardSortControls: FC<SkuProductSortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={skuProductSortOptions}
      onSortByChange={(val) => onSortByChange(val as SkuProductCardSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default ProductCatalogCardSortControls;
