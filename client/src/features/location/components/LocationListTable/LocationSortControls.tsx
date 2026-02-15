import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { LocationSortField } from '@features/location/state';

/**
 * Props for Location sort controls.
 */
interface LocationSortControlsProps {
  sortBy: LocationSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: LocationSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

/**
 * Sort options available for Location records.
 *
 * Order is intentional:
 * - Core identity
 * - Geography
 * - Status
 * - Audit
 * - Default fallback
 */
const locationSortOptions: {
  label: string;
  value: LocationSortField;
}[] = [
  // ---- Core identity ----
  { label: 'Name', value: 'name' },
  { label: 'Location Type', value: 'locationTypeName' },
  
  // ---- Geography ----
  { label: 'City', value: 'city' },
  { label: 'Province / State', value: 'provinceOrState' },
  { label: 'Country', value: 'country' },
  
  // ---- Status ----
  { label: 'Archived', value: 'isArchived' },
  { label: 'Status', value: 'statusName' },
  { label: 'Status Date', value: 'statusDate' },
  
  // ---- Audit ----
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  { label: 'Created By', value: 'createdBy' },
  { label: 'Updated By', value: 'updatedBy' },
  
  // ---- Default fallback ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

/**
 * Sort controls for Location list page.
 *
 * Thin semantic wrapper around the shared <SortControls /> component.
 * Keeps Location-specific sort semantics isolated and explicit.
 */
const LocationSortControls: FC<LocationSortControlsProps> = ({
                                                               sortBy,
                                                               sortOrder,
                                                               onSortByChange,
                                                               onSortOrderChange,
                                                             }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={locationSortOptions}
      onSortByChange={(val) =>
        onSortByChange(val as LocationSortField)
      }
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default LocationSortControls;
