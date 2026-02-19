import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type {
  PackagingMaterialBatchSortKey,
} from '@features/packagingMaterialBatch/state';

/**
 * Props for Packaging Material Batch sort controls.
 */
interface PackagingMaterialBatchSortControlsProps {
  sortBy: PackagingMaterialBatchSortKey | '';
  sortOrder: SortOrder;
  onSortByChange: (value: PackagingMaterialBatchSortKey) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

/**
 * Sort options available for Packaging Material Batch records.
 *
 * Order reflects operational relevance:
 * - Intake & identity
 * - Lifecycle
 * - Material metadata
 * - Supplier metadata
 * - Quantity
 * - Status
 * - Audit
 * - Default fallback
 */
const packagingMaterialBatchSortOptions: {
  label: string;
  value: PackagingMaterialBatchSortKey;
}[] = [
  // ---- Intake & identity ----
  { label: 'Received At', value: 'receivedAt' },
  { label: 'Lot Number', value: 'lotNumber' },
  
  // ---- Lifecycle ----
  { label: 'Manufacture Date', value: 'manufactureDate' },
  { label: 'Expiry Date', value: 'expiryDate' },
  
  // ---- Material metadata ----
  { label: 'Material Name', value: 'materialInternalName' },
  { label: 'Supplier Label', value: 'supplierLabelName' },
  { label: 'Material Code', value: 'packagingMaterialCode' },
  { label: 'Material Category', value: 'packagingMaterialCategory' },
  
  // ---- Supplier metadata ----
  { label: 'Supplier', value: 'supplierName' },
  { label: 'Preferred Supplier', value: 'isPreferredSupplier' },
  { label: 'Supplier Lead Time', value: 'supplierLeadTime' },
  
  // ---- Quantity ----
  { label: 'Quantity', value: 'quantity' },
  
  // ---- Status ----
  { label: 'Status', value: 'statusName' },
  { label: 'Status Date', value: 'statusDate' },
  
  // ---- Audit ----
  { label: 'Received By', value: 'receivedBy' },
  { label: 'Created At', value: 'createdAt' },
  
  // ---- Default fallback ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

/**
 * Sort controls for Packaging Material Batch list page.
 *
 * Thin semantic wrapper around the shared <SortControls /> component.
 * Keeps Packaging Material–specific sort semantics isolated and explicit.
 */
const PackagingMaterialBatchSortControls: FC<
  PackagingMaterialBatchSortControlsProps
> = ({
       sortBy,
       sortOrder,
       onSortByChange,
       onSortOrderChange,
     }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={packagingMaterialBatchSortOptions}
      onSortByChange={(val) =>
        onSortByChange(val as PackagingMaterialBatchSortKey)
      }
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default PackagingMaterialBatchSortControls;
