import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { ProductBatchSortField } from '@features/productBatch/state';

/**
 * Props for Product Batch sort controls.
 */
interface ProductBatchSortControlsProps {
  sortBy: ProductBatchSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: ProductBatchSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

/**
 * Sort options available for Product Batch records.
 *
 * Order is intentional:
 * - Core identity
 * - Lot & lifecycle
 * - Status & release
 * - Product metadata
 * - SKU metadata
 * - Manufacturer
 * - Quantity
 * - Audit
 * - Default fallback
 */
const productBatchSortOptions: {
  label: string;
  value: ProductBatchSortField;
}[] = [
  // ---- Core identity ----
  { label: 'Created At', value: 'createdAt' },

  // ---- Lot & lifecycle ----
  { label: 'Lot Number', value: 'lotNumber' },
  { label: 'Manufacture Date', value: 'manufactureDate' },
  { label: 'Expiry Date', value: 'expiryDate' },
  { label: 'Received Date', value: 'receivedDate' },

  // ---- Status & release ----
  { label: 'Status', value: 'statusName' },
  { label: 'Status Date', value: 'statusDate' },
  { label: 'Released At', value: 'releasedAt' },

  // ---- Product metadata ----
  { label: 'Product Name', value: 'productName' },
  { label: 'Brand', value: 'productBrand' },
  { label: 'Category', value: 'productCategory' },

  // ---- SKU metadata ----
  { label: 'SKU Code', value: 'skuCode' },
  { label: 'Size Label', value: 'sizeLabel' },
  { label: 'Country Code', value: 'countryCode' },

  // ---- Manufacturer ----
  { label: 'Manufacturer', value: 'manufacturerName' },

  // ---- Quantity ----
  { label: 'Initial Quantity', value: 'initialQuantity' },

  // ---- Audit ----
  { label: 'Last Updated At', value: 'updatedAt' },
  { label: 'Released By', value: 'releasedBy' },

  // ---- Default fallback ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

/**
 * Sort controls for Product Batch list page.
 *
 * Thin semantic wrapper around the shared <SortControls /> component.
 * Keeps Product Batch–specific sort semantics isolated and explicit.
 */
const ProductBatchSortControls: FC<ProductBatchSortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={productBatchSortOptions}
      onSortByChange={(val) => onSortByChange(val as ProductBatchSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default ProductBatchSortControls;
