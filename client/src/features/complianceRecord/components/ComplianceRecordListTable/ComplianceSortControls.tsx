import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { ComplianceRecordSortField } from '@features/complianceRecord/state';

/**
 * Props for Compliance sort controls.
 */
interface ComplianceSortControlsProps {
  sortBy: ComplianceRecordSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: ComplianceRecordSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

/**
 * Sort options available for Compliance Records.
 *
 * Order is intentional:
 * - Core compliance identifiers
 * - Product / SKU context
 * - Status
 * - Dates
 * - Audit
 * - Default fallback
 */
const complianceSortOptions: {
  label: string;
  value: ComplianceRecordSortField;
}[] = [
  // ---- Core compliance fields ----
  { label: 'Compliance Number', value: 'complianceNumber' },
  
  // ---- Product / SKU context ----
  { label: 'Product Name', value: 'productName' },
  { label: 'SKU Code', value: 'skuCode' },
  
  // ---- Status ----
  { label: 'Status', value: 'status' },
  
  // ---- Compliance dates ----
  { label: 'Issued Date', value: 'issuedDate' },
  { label: 'Expiry Date', value: 'expiryDate' },
  
  // ---- Audit fields ----
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  
  // ---- Default fallback ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

/**
 * Sort controls for Compliance Records list page.
 *
 * Thin semantic wrapper around the shared <SortControls /> component.
 */
const ComplianceSortControls: FC<ComplianceSortControlsProps> = ({
                                                                   sortBy,
                                                                   sortOrder,
                                                                   onSortByChange,
                                                                   onSortOrderChange,
                                                                 }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={complianceSortOptions}
      onSortByChange={(val) =>
        onSortByChange(val as ComplianceRecordSortField)
      }
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default ComplianceSortControls;
