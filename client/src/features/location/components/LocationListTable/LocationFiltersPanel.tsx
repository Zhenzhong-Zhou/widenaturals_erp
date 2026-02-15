import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import {
  StatusMultiSelectDropdown,
  // LocationTypeDropdown,
  UserDropdown,
} from '@features/lookup/components';
import {
  renderBooleanSelectField,
  renderDateField,
  renderInputField,
} from '@utils/filters/filterUtils';
import {
  useMultiSelectBinding,
  useUserLookupBinding,
} from '@features/lookup/hooks';
import type { LocationListFilters } from '@features/location/state';
import type {
  LookupOption,
  LookupPaginationMeta,
  UserLookupParams,
} from '@features/lookup';
import { formatLabel } from '@utils/textUtils';
import { toISODate } from '@utils/dateTimeUtils';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';

/* =========================================================
 * Types
 * ======================================================= */

interface LocationFiltersPanelLookups {
  status: ReturnType<any>;
}

interface LocationLookupHandlers {
  onOpen: {
    status?: () => void;
  };
}

interface Props {
  filters: LocationListFilters;
  lookups: LocationFiltersPanelLookups;
  lookupHandlers: LocationLookupHandlers;
  onChange: (filters: LocationListFilters) => void;
  onApply: () => void;
  onReset: () => void;

  // Shared user lookup
  userOptions: LookupOption[];
  userLoading?: boolean;
  userError?: string | null;
  userMeta: LookupPaginationMeta;

  fetchUserLookup: (params?: UserLookupParams) => void;
}

/* =========================================================
 * Defaults
 * ======================================================= */

const emptyFilters: LocationListFilters = {
  statusIds: undefined,
  locationTypeId: undefined,
  city: '',
  province_or_state: '',
  country: '',
  includeArchived: undefined,
  createdBy: undefined,
  updatedBy: undefined,
  createdAfter: '',
  createdBefore: '',
  updatedAfter: '',
  updatedBefore: '',
  keyword: '',
};

export type LocationTextField = {
  name: keyof Pick<
    LocationListFilters,
    'city' | 'province_or_state' | 'country'
  >;
  label: string;
  placeholder?: string;
};

export const LOCATION_TEXT_FIELDS: LocationTextField[] = [
  { name: 'city', label: 'City' },
  {
    name: 'province_or_state',
    label: 'Province / State',
  },
  { name: 'country', label: 'Country' },
];

export type LocationDateField = {
  name: 'createdAfter' | 'createdBefore' | 'updatedAfter' | 'updatedBefore';
  label: string;
};

export const LOCATION_DATE_FIELDS: LocationDateField[] = [
  // --- Created ---
  { name: 'createdAfter', label: 'Created Date ≥' },
  { name: 'createdBefore', label: 'Created Date <' },

  // --- Updated ---
  { name: 'updatedAfter', label: 'Updated Date ≥' },
  { name: 'updatedBefore', label: 'Updated Date <' },
];

/* =========================================================
 * Component
 * ======================================================= */

/**
 * Filter panel for Location list page.
 *
 * Provides filtering by:
 * - status
 * - location type
 * - geography
 * - audit users
 * - created date range
 * - archived flag
 * - keyword search
 */
const LocationFiltersPanel: FC<Props> = ({
  filters,
  lookups,
  lookupHandlers,
  onChange,
  onApply,
  onReset,

  // -------------------
  // Shared user lookup
  // -------------------
  userOptions,
  userLoading,
  userError,
  userMeta,
  fetchUserLookup,
}) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<LocationListFilters>({
      defaultValues: filters,
    });

  const { status } = lookups;

  const createdByLookup = useUserLookupBinding({
    fetchUserLookup,
  });

  const updatedByLookup = useUserLookupBinding({
    fetchUserLookup,
  });

  /* -----------------------------
   * Sync external filters
   * --------------------------- */

  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  /* -----------------------------
   * Status multiselect
   * --------------------------- */

  const {
    selectedOptions: selectedStatusOptions,
    handleSelect: handleStatusSelect,
  } = useMultiSelectBinding({
    watch,
    setValue,
    fieldName: 'statusIds',
    options: status.options,
  });

  const formattedStatusOptions = useFormattedOptions(
    status.options,
    formatLabel
  );

  /* -----------------------------
   * Submit / Reset
   * --------------------------- */

  const submitFilters = (data: LocationListFilters) => {
    const adjusted: LocationListFilters = {
      ...data,
      keyword: data.keyword || undefined,
      city: data.city || undefined,
      province_or_state: data.province_or_state || undefined,
      country: data.country || undefined,

      includeArchived: data.includeArchived || undefined,

      createdAfter: toISODate(data.createdAfter),
      createdBefore: toISODate(data.createdBefore),
      updatedAfter: toISODate(data.updatedAfter),
      updatedBefore: toISODate(data.updatedBefore),
    };

    onChange(adjusted);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };

  const handleCreatedByOpen = () => {
    if (!userOptions.length) {
      createdByLookup.handleRefresh();
    }
  };

  const handleUpdatedByOpen = () => {
    if (!userOptions.length) {
      updatedByLookup.handleRefresh();
    }
  };

  /* -----------------------------
   * Render
   * --------------------------- */

  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          {/* --- Status --- */}
          <Grid size={{ xs: 12, md: 6 }}>
            <StatusMultiSelectDropdown
              options={formattedStatusOptions}
              selectedOptions={selectedStatusOptions}
              onChange={handleStatusSelect}
              onOpen={lookupHandlers.onOpen.status}
            />
          </Grid>

          {/* --- Location Type --- */}
          <Grid size={{ xs: 12, md: 6 }}>
            {/*<LocationTypeDropdown*/}
            {/*  options={locationType.options}*/}
            {/*  loading={locationType.loading}*/}
            {/*  value={watch('locationTypeId')}*/}
            {/*  onChange={(value) => setValue('locationTypeId', value)}*/}
            {/*/>*/}
          </Grid>

          {/* --- Geography --- */}
          {LOCATION_TEXT_FIELDS.map(({ name, label, placeholder }) =>
            renderInputField(control, name, label, placeholder)
          )}

          {/* --- Archived --- */}
          {renderBooleanSelectField(
            control,
            'includeArchived',
            'Include Archived'
          )}

          {/* --- Audit Users --- */}
          <Grid size={{ xs: 12, md: 4 }}>
            <UserDropdown
              label="Created By"
              value={filters.createdBy ?? null}
              options={userOptions}
              loading={userLoading}
              error={userError}
              paginationMeta={userMeta}
              fetchParams={createdByLookup.fetchParams}
              setFetchParams={createdByLookup.setFetchParams}
              onChange={(val) =>
                setValue('createdBy', val, { shouldDirty: true })
              }
              onRefresh={createdByLookup.handleRefresh}
              onOpen={handleCreatedByOpen}
              onInputChange={createdByLookup.handleInputChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <UserDropdown
              label="Updated By"
              value={filters.updatedBy ?? null}
              options={userOptions}
              loading={userLoading}
              error={userError}
              paginationMeta={userMeta}
              fetchParams={updatedByLookup.fetchParams}
              setFetchParams={updatedByLookup.setFetchParams}
              onChange={(val) =>
                setValue('updatedBy', val, { shouldDirty: true })
              }
              onRefresh={updatedByLookup.handleRefresh}
              onOpen={handleUpdatedByOpen}
              onInputChange={updatedByLookup.handleInputChange}
            />
          </Grid>

          {/* --- Date Range --- */}
          {LOCATION_DATE_FIELDS.map(({ name, label }) =>
            renderDateField(control, name, label)
          )}

          {/* --- Keyword --- */}
          {renderInputField(
            control,
            'keyword',
            'Keyword',
            'Name, city, province, country'
          )}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default LocationFiltersPanel;
