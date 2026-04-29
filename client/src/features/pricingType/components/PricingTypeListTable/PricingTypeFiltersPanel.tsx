import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import { renderDateField, renderInputField } from '@utils/filters/filterUtils';
import { formatLabel } from '@utils/textUtils';
import { toISODate } from '@utils/dateTimeUtils';
import type { PricingTypeFilters } from '@features/pricingType';
import { StatusMultiSelectDropdown } from '@features/lookup/components';
import type { useStatusLookup } from '@hooks/index';
import { useMultiSelectBinding } from '@features/lookup/hooks';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';

/* =========================================================
 * Types
 * ======================================================= */

interface PricingTypeFiltersPanelLookups {
  status: ReturnType<typeof useStatusLookup>;
}

interface PricingTypeLookupHandlers {
  onOpen: {
    status: () => void;
  };
}

interface Props {
  filters: PricingTypeFilters;
  lookups: PricingTypeFiltersPanelLookups;
  lookupHandlers: PricingTypeLookupHandlers;
  onChange: (filters: PricingTypeFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

/* =========================================================
 * Defaults
 * ======================================================= */

const emptyFilters: PricingTypeFilters = {
  search: '',
  statusId: undefined,
  createdAfter: '',
  createdBefore: '',
};

interface PricingTypeDateField {
  name: 'createdAfter' | 'createdBefore';
  label: string;
}

const PRICING_TYPE_DATE_FIELDS: PricingTypeDateField[] = [
  { name: 'createdAfter', label: 'Created Date ≥' },
  { name: 'createdBefore', label: 'Created Date <' },
];

/* =========================================================
 * Component
 * ======================================================= */

/**
 * Filter panel for the pricing type list page.
 *
 * Provides filtering by:
 * - search (name, code, slug)
 * - status
 * - audit creation date range
 */
const PricingTypeFiltersPanel: FC<Props> = ({
                                              filters,
                                              lookups,
                                              lookupHandlers,
                                              onChange,
                                              onApply,
                                              onReset,
                                            }) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<PricingTypeFilters>({
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
   * Submit / Reset
   * --------------------------- */
  
  const submitFilters = (data: PricingTypeFilters) => {
    const adjusted: PricingTypeFilters = {
      ...data,
      search: data.search || undefined,
      createdAfter: toISODate(data.createdAfter),
      createdBefore: toISODate(data.createdBefore),
    };
    
    onChange(adjusted);
    onApply();
  };
  
  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };
  
  /* -----------------------------
   * Status single select
   * --------------------------- */
  
  const {
    selectedOptions: selectedStatusOptions,
    handleSelect: handleStatusSelect,
  } = useMultiSelectBinding({
    watch,
    setValue,
    fieldName: 'statusId',
    options: status.options,
  });
  
  const formattedStatusOptions = useFormattedOptions(
    status.options,
    formatLabel
  );
  
  /* -----------------------------
   * Render
   * --------------------------- */
  
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          {/* --- Search --- */}
          {renderInputField(
            control,
            'search',
            'Search',
            'Name, code, or slug'
          )}
          
          {/* --- Status --- */}
          <Grid size={{ xs: 12, md: 3 }}>
            <StatusMultiSelectDropdown
              options={formattedStatusOptions}
              selectedOptions={selectedStatusOptions}
              onChange={handleStatusSelect}
              onOpen={lookupHandlers.onOpen.status}
            />
          </Grid>
          
          {/* --- Date ranges --- */}
          {PRICING_TYPE_DATE_FIELDS.map(({ name, label }) =>
            renderDateField(control, name, label)
          )}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default PricingTypeFiltersPanel;
