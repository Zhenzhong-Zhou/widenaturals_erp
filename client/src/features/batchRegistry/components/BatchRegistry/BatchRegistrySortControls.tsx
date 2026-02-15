import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { BatchRegistrySortField } from '@features/batchRegistry/state';

/**
 * Props for Batch Registry sort controls.
 */
interface BatchRegistrySortControlsProps {
  sortBy: BatchRegistrySortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: BatchRegistrySortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

/**
 * Sort options available for Batch Registry records.
 *
 * Order is intentional:
 * - Core registry identity
 * - Lot & expiry context
 * - Status
 * - Product metadata
 * - Packaging metadata
 * - Audit
 * - Default fallback
 */
const batchRegistrySortOptions: {
  label: string;
  value: BatchRegistrySortField;
}[] = [
  // ---- Core registry identity ----
  { label: 'Registered At', value: 'registeredAt' },

  // ---- Lot & expiry ----
  { label: 'Lot Number', value: 'lotNumber' },
  { label: 'Expiry Date', value: 'expiryDate' },

  // ---- Status ----
  { label: 'Status', value: 'statusName' },
  { label: 'Status Date', value: 'statusDate' },

  // ---- Product metadata ----
  { label: 'Product Name', value: 'productName' },
  { label: 'SKU Code', value: 'skuCode' },
  { label: 'Manufacturer', value: 'manufacturerName' },

  // ---- Packaging metadata ----
  { label: 'Packaging Material', value: 'packagingMaterialName' },
  { label: 'Supplier', value: 'supplierName' },

  // ---- Audit ----
  { label: 'Registered By', value: 'registeredBy' },

  // ---- Default fallback ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

/**
 * Sort controls for Batch Registry list page.
 *
 * Thin semantic wrapper around the shared <SortControls /> component.
 * Keeps Batch Registry–specific sort semantics isolated and explicit.
 */
const BatchRegistrySortControls: FC<BatchRegistrySortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={batchRegistrySortOptions}
      onSortByChange={(val) => onSortByChange(val as BatchRegistrySortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default BatchRegistrySortControls;
