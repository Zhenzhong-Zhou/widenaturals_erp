import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { PricingSortField } from '@features/pricing';

interface PricingSortControlsProps {
  sortBy: PricingSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: PricingSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const pricingSortOptions: { label: string; value: PricingSortField }[] = [
  // ---- Product fields ----
  { label: 'Product Name',  value: 'productName' },
  { label: 'Brand',         value: 'brand' },
  { label: 'Category',      value: 'category' },
  
  // ---- SKU fields ----
  { label: 'SKU',           value: 'sku' },
  { label: 'Barcode',       value: 'barcode' },
  { label: 'Size Label',    value: 'sizeLabel' },
  { label: 'SKU Country',   value: 'skuCountryCode' },
  
  // ---- Pricing fields ----
  { label: 'Price',         value: 'price' },
  { label: 'Country Code',  value: 'countryCode' },
  { label: 'Valid From',    value: 'validFrom' },
  { label: 'Valid To',      value: 'validTo' },
  
  // ---- Status fields ----
  { label: 'Status',        value: 'statusName' },
  
  // ---- Default natural sort ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

const PricingSortControls: FC<PricingSortControlsProps> = ({
                                                             sortBy,
                                                             sortOrder,
                                                             onSortByChange,
                                                             onSortOrderChange,
                                                           }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={pricingSortOptions}
      onSortByChange={(val) => onSortByChange(val as PricingSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default PricingSortControls;
