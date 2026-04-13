import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { PricingGroupSortField } from '@features/pricingGroup';

interface PricingGroupSortControlsProps {
  sortBy: PricingGroupSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: PricingGroupSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
  showPricingType?: boolean;
}

const pricingGroupSortOptions = (
  showPricingType = true
): { label: string; value: PricingGroupSortField }[] => [
  // ---- Identity ----
  ...(showPricingType ? [
    { label: 'Pricing Type', value: 'pricingTypeName' as PricingGroupSortField },
    { label: 'Code',         value: 'pricingTypeCode' as PricingGroupSortField },
  ] : []),
  { label: 'Country', value: 'countryCode' as PricingGroupSortField },
  
  // ---- Pricing ----
  { label: 'Price',      value: 'price'    as PricingGroupSortField },
  { label: 'Valid From', value: 'validFrom' as PricingGroupSortField },
  
  // ---- Status ----
  { label: 'Status', value: 'statusName' as PricingGroupSortField },
  
  // ---- Counts ----
  { label: 'SKU Count',     value: 'skuCount'     as PricingGroupSortField },
  { label: 'Product Count', value: 'productCount' as PricingGroupSortField },
  
  // ---- Audit ----
  { label: 'Last Updated', value: 'updatedAt' as PricingGroupSortField },
  
  // ---- Default fallback ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' as PricingGroupSortField },
];

/**
 * Sort controls for the pricing group list page.
 *
 * Thin semantic wrapper around the shared <SortControls /> component.
 * Keeps pricing group–specific sort semantics isolated and explicit.
 */
const PricingGroupSortControls: FC<PricingGroupSortControlsProps> = ({
                                                                       sortBy,
                                                                       sortOrder,
                                                                       onSortByChange,
                                                                       onSortOrderChange,
                                                                       showPricingType = true,
                                                                     }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={pricingGroupSortOptions(showPricingType)}
      onSortByChange={(val) => onSortByChange(val as PricingGroupSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default PricingGroupSortControls;
