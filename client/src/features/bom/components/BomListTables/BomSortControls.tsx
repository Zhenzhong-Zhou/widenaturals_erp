import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { BomSortField } from '@features/bom/state';

interface BomSortControlsProps {
  sortBy: BomSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: BomSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const bomSortOptions: { label: string; value: BomSortField }[] = [
  { label: 'Product Name', value: 'productName' },
  { label: 'Brand', value: 'brand' },
  { label: 'Series', value: 'series' },
  { label: 'Category', value: 'category' },
  { label: 'SKU Code', value: 'skuCode' },
  { label: 'Compliance Type', value: 'complianceType' },
  { label: 'Compliance Status', value: 'complianceStatus' },
  { label: 'Revision', value: 'revision' },
  { label: 'Active', value: 'isActive' },
  { label: 'Default', value: 'isDefault' },
  { label: 'Status Date', value: 'statusDate' },
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

const BomSortControls: FC<BomSortControlsProps> = ({
                                                     sortBy,
                                                     sortOrder,
                                                     onSortByChange,
                                                     onSortOrderChange,
                                                   }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={bomSortOptions}
      onSortByChange={(val) => onSortByChange(val as BomSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default BomSortControls;
