import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import {
  renderDateField,
  renderInputField,
  renderNumericField
} from '@utils/filters/filterUtils';
import { formatLabel } from '@utils/textUtils';
import { toISODate } from '@utils/dateTimeUtils';
import type { PricingGroupFilters } from '@features/pricingGroup';
import { StatusMultiSelectDropdown } from '@features/lookup/components';
import type { useStatusLookup } from '@hooks/index';
import { useMultiSelectBinding } from '@features/lookup/hooks';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';

/* =========================================================
 * Types
 * ======================================================= */

interface PricingGroupFiltersPanelLookups {
  status:      ReturnType<typeof useStatusLookup>;
}

interface PricingGroupLookupHandlers {
  onOpen: {
    status:      () => void;
  };
}

interface Props {
  filters:        PricingGroupFilters;
  lookups:        PricingGroupFiltersPanelLookups;
  lookupHandlers: PricingGroupLookupHandlers;
  onChange:       (filters: PricingGroupFilters) => void;
  onApply:        () => void;
  onReset:        () => void;
}

/* =========================================================
 * Defaults
 * ======================================================= */

const emptyFilters: PricingGroupFilters = {
  keyword:       '',
  pricingTypeId: undefined,
  statusId:      undefined,
  countryCode:   undefined,
  priceMin:      undefined,
  priceMax:      undefined,
  validFrom:     '',
  validTo:       '',
  validOn:       '',
  currentlyValid: undefined,
  createdAfter:  '',
  createdBefore: '',
  updatedAfter:  '',
  updatedBefore: '',
};

interface PricingGroupDateField {
  name: 'validFrom' | 'validTo' | 'validOn' | 'createdAfter' | 'createdBefore' | 'updatedAfter' | 'updatedBefore';
  label: string;
}

const PRICING_GROUP_DATE_FIELDS: PricingGroupDateField[] = [
  { name: 'validFrom',     label: 'Valid From ≥'     },
  { name: 'validTo',       label: 'Valid To ≤'       },
  { name: 'validOn',       label: 'Valid On'          },
  { name: 'createdAfter',  label: 'Created Date ≥'   },
  { name: 'createdBefore', label: 'Created Date <'   },
  { name: 'updatedAfter',  label: 'Updated Date ≥'   },
  { name: 'updatedBefore', label: 'Updated Date <'   },
];

/* =========================================================
 * Component
 * ======================================================= */

/**
 * Filter panel for the pricing group list page.
 *
 * Provides filtering by:
 * - keyword (name, code, country)
 * - pricing type
 * - status
 * - country code
 * - price range
 * - validity date range and point-in-time
 * - audit creation date range
 */
const PricingGroupFiltersPanel: FC<Props> = ({
                                               filters,
                                               lookups,
                                               lookupHandlers,
                                               onChange,
                                               onApply,
                                               onReset,
                                             }) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<PricingGroupFilters>({
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
  
  const submitFilters = (data: PricingGroupFilters) => {
    const adjusted: PricingGroupFilters = {
      ...data,
      keyword:       data.keyword     || undefined,
      countryCode:   data.countryCode || undefined,
      priceMin:      data.priceMin    ?? undefined,
      priceMax:      data.priceMax    ?? undefined,
      validFrom:     toISODate(data.validFrom),
      validTo:       toISODate(data.validTo),
      validOn:       toISODate(data.validOn),
      createdAfter:  toISODate(data.createdAfter),
      createdBefore: toISODate(data.createdBefore),
      updatedAfter:  toISODate(data.updatedAfter),
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
   * Status
   * --------------------------- */
  
  const {
    selectedOptions: selectedStatusOptions,
    handleSelect:    handleStatusSelect,
  } = useMultiSelectBinding({
    watch,
    setValue,
    fieldName: 'statusId',
    options:   status.options,
  });
  
  const formattedStatusOptions = useFormattedOptions(status.options, formatLabel);
  
  /* -----------------------------
   * Render
   * --------------------------- */
  
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          {/* --- Keyword --- */}
          {renderInputField(control, 'keyword', 'Keyword', 'Search pricing groups')}
          
          {/* --- Country Code --- */}
          {renderInputField(control, 'countryCode', 'Country Code', 'e.g. CA, US, GLOBAL')}
          
          {/* --- Price Range --- */}
          {renderNumericField(control, 'priceMin', 'Min Price')}
          {renderNumericField(control, 'priceMax', 'Max Price')}
          
          {/* --- Status --- */}
          <Grid size={{ xs: 12, md: 3 }}>
            <StatusMultiSelectDropdown
              options={formattedStatusOptions}
              selectedOptions={selectedStatusOptions}
              onChange={handleStatusSelect}
              onOpen={lookupHandlers.onOpen.status}
            />
          </Grid>
          
          {/* --- Date fields --- */}
          {PRICING_GROUP_DATE_FIELDS.map(({ name, label }) =>
            renderDateField(control, name, label)
          )}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default PricingGroupFiltersPanel;
