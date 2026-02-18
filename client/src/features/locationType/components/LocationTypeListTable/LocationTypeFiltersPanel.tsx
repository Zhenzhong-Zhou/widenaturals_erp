import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import { StatusMultiSelectDropdown } from '@features/lookup/components';
import { renderDateField, renderInputField } from '@utils/filters/filterUtils';
import { useMultiSelectBinding } from '@features/lookup/hooks';
import type { LocationTypeListFilters } from '@features/locationType/state';
import { formatLabel } from '@utils/textUtils';
import { toISODate } from '@utils/dateTimeUtils';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';

/* =========================================================
 * Types
 * ======================================================= */

interface LocationTypeFiltersPanelLookups {
  status: ReturnType<any>;
}

interface LocationTypeLookupHandlers {
  onOpen: {
    status?: () => void;
  };
}

interface Props {
  filters: LocationTypeListFilters;
  lookups: LocationTypeFiltersPanelLookups;
  lookupHandlers: LocationTypeLookupHandlers;
  onChange: (filters: LocationTypeListFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

/* =========================================================
 * Defaults
 * ======================================================= */

const emptyFilters: LocationTypeListFilters = {
  statusIds: undefined,
  name: '',
  createdAfter: '',
  createdBefore: '',
  updatedAfter: '',
  updatedBefore: '',
  keyword: '',
};

type LocationTypeDateField = {
  name: 'createdAfter' | 'createdBefore' | 'updatedAfter' | 'updatedBefore';
  label: string;
};

const LOCATION_TYPE_DATE_FIELDS: LocationTypeDateField[] = [
  { name: 'createdAfter', label: 'Created Date ≥' },
  { name: 'createdBefore', label: 'Created Date <' },
  { name: 'updatedAfter', label: 'Updated Date ≥' },
  { name: 'updatedBefore', label: 'Updated Date <' },
];

/* =========================================================
 * Component
 * ======================================================= */

/**
 * Filter panel for Location Type list page.
 *
 * Provides filtering by:
 * - status
 * - name
 * - created/updated date range
 * - keyword search
 *
 * This panel intentionally excludes:
 * - user lookup
 * - geography
 * - archived flag
 */
const LocationTypeFiltersPanel: FC<Props> = ({
  filters,
  lookups,
  lookupHandlers,
  onChange,
  onApply,
  onReset,
}) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<LocationTypeListFilters>({
      defaultValues: filters,
    });

  const { status } = lookups;

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

  const submitFilters = (data: LocationTypeListFilters) => {
    const adjusted: LocationTypeListFilters = {
      ...data,
      keyword: data.keyword || undefined,
      name: data.name || undefined,

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

          {/* --- Name --- */}
          {renderInputField(control, 'name', 'Type Name', 'Search by name')}

          {/* --- Keyword --- */}
          {renderInputField(
            control,
            'keyword',
            'Keyword',
            'Name or description'
          )}

          {/* --- Date Range --- */}
          {LOCATION_TYPE_DATE_FIELDS.map(({ name, label }) =>
            renderDateField(control, name, label)
          )}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default LocationTypeFiltersPanel;
