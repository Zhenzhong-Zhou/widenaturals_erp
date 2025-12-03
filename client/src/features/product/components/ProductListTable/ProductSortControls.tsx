import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { ProductSortField } from '@features/product/state/productTypes';

interface ProductSortControlsProps {
  sortBy: ProductSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: ProductSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const productSortOptions: { label: string; value: ProductSortField }[] = [
  // ---- Product fields ----
  { label: 'Product Name', value: 'productName' },
  { label: 'Series', value: 'series' },
  { label: 'Brand', value: 'brand' },
  { label: 'Category', value: 'category' },
  { label: 'Description', value: 'description' },

  // ---- Status fields ----
  { label: 'Status Name', value: 'statusName' },
  { label: 'Status ID', value: 'statusId' },
  { label: 'Status Date', value: 'statusDate' },

  // ---- Audit fields ----
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  { label: 'Created By (First Name)', value: 'createdByFirstName' },
  { label: 'Created By (Last Name)', value: 'createdByLastName' },
  { label: 'Updated By (First Name)', value: 'updatedByFirstName' },
  { label: 'Updated By (Last Name)', value: 'updatedByLastName' },

  // ---- Default natural sort ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

const ProductSortControls: FC<ProductSortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={productSortOptions}
      onSortByChange={(val) => onSortByChange(val as ProductSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default ProductSortControls;
