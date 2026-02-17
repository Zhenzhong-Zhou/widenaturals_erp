import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { LocationTypeSortField } from '@features/locationType/state';

/**
 * Props for Location Type sort controls.
 */
interface LocationTypeSortControlsProps {
  sortBy: LocationTypeSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: LocationTypeSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

/**
 * Sort options available for Location Type records.
 *
 * Order is intentional:
 * - Core identity
 * - Status
 * - Audit
 * - Default fallback
 */
const locationTypeSortOptions: {
  label: string;
  value: LocationTypeSortField;
}[] = [
  // ---- Core identity ----
  { label: 'Name', value: 'name' },
  
  // ---- Status ----
  { label: 'Status', value: 'statusName' },
  { label: 'Status Date', value: 'statusDate' },
  
  // ---- Audit ----
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  
  // ---- Default fallback ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

/**
 * Sort controls for Location Type list page.
 *
 * Thin semantic wrapper around the shared <SortControls /> component.
 * Keeps Location Type-specific sort semantics isolated and explicit.
 */
const LocationTypeSortControls: FC<LocationTypeSortControlsProps> = ({
                                                                       sortBy,
                                                                       sortOrder,
                                                                       onSortByChange,
                                                                       onSortOrderChange,
                                                                     }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={locationTypeSortOptions}
      onSortByChange={(val) =>
        onSortByChange(val as LocationTypeSortField)
      }
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default LocationTypeSortControls;
