import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { PricingTypeSortField } from '@features/pricingType';

/**
 * Props for pricing type sort controls.
 */
interface PricingTypeSortControlsProps {
  sortBy: PricingTypeSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: PricingTypeSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

/**
 * Sort options available for pricing type records.
 *
 * Order is intentional:
 * - Identity
 * - Status
 * - Audit
 * - Default fallback
 */
const pricingTypeSortOptions: {
  label: string;
  value: PricingTypeSortField;
}[] = [
  // ---- Identity ----
  { label: 'Name', value: 'pricingTypeName' },
  { label: 'Code', value: 'pricingTypeCode' },
  { label: 'Slug', value: 'pricingTypeSlug' },
  
  // ---- Status ----
  { label: 'Status', value: 'statusName' },
  { label: 'Status Date', value: 'statusDate' },
  
  // ---- Audit ----
  { label: 'Created At', value: 'createdAt' },
  { label: 'Last Updated At', value: 'updatedAt' },
  
  // ---- Default fallback ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

/**
 * Sort controls for the pricing type list page.
 *
 * Thin semantic wrapper around the shared <SortControls /> component.
 * Keeps pricing type–specific sort semantics isolated and explicit.
 */
const PricingTypeSortControls: FC<PricingTypeSortControlsProps> = ({
                                                                     sortBy,
                                                                     sortOrder,
                                                                     onSortByChange,
                                                                     onSortOrderChange,
                                                                   }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={pricingTypeSortOptions}
      onSortByChange={(val) => onSortByChange(val as PricingTypeSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default PricingTypeSortControls;
