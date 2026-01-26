import { type FC, useEffect } from 'react';
import { Path, useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import {
  renderDateField,
  renderInputField
} from '@utils/filters/filterUtils';
import type { ComplianceFilters } from '@features/complianceRecord/state';
import type { FilterField } from '@shared-types/shared';
import {
  useProductLookup,
  useSkuLookup,
  useStatusLookup }
  from '@hooks/index';
import {
  useFilterLookup,
  useMultiSelectBinding,
  useProductSearchHandlers,
  useSkuSearchHandlers,
} from '@features/lookup/hooks';
import {
  ProductMultiSelectDropdown,
  SkuMultiSelectDropdown,
  StatusMultiSelectDropdown,
} from '@features/lookup/components';
import { formatLabel } from '@utils/textUtils';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';

interface ComplianceFiltersPanelLookups {
  product: ReturnType<typeof useProductLookup>;
  sku: ReturnType<typeof useSkuLookup>;
  status: ReturnType<typeof useStatusLookup>;
}

interface ComplianceLookupHandlers {
  onOpen: {
    status: () => void;
  };
}

interface Props {
  filters: ComplianceFilters;

  /** Lookup data & state (options, loading, etc.) */
  lookups: ComplianceFiltersPanelLookups;

  /** Lookup UI handlers (lazy fetch on open, etc.) */
  lookupHandlers: ComplianceLookupHandlers;

  onChange: (filters: ComplianceFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

/**
 * Empty filter defaults for compliance records.
 *
 * Note:
 * - Date ranges are reset as `undefined` (not empty objects)
 */
const emptyFilters: ComplianceFilters = {
  keyword: '',
  complianceId: '',
  sizeLabel: '',
  marketRegion: '',
  dateRanges: undefined,
};

// ---------------------------------------
// Standard text input fields
// ---------------------------------------
const TEXT_FIELDS: FilterField<ComplianceFilters>[] = [
  {
    name: 'keyword',
    label: 'Keyword',
    placeholder: 'Compliance #, Product, SKU…',
  },
  { name: 'complianceId', label: 'Compliance Number' },

  // SKU
  { name: 'sizeLabel', label: 'Size Label' },
  { name: 'marketRegion', label: 'Market Region' },
];

interface ComplianceDateField {
  name: Path<ComplianceFilters>;
  label: string;
}

// ---------------------------------------
// Compliance date range filters
// ---------------------------------------
export const COMPLIANCE_DATE_FIELDS: ComplianceDateField[] = [
  // Issued date
  { name: 'dateRanges.issued.from', label: 'Issued Date ≥' },
  { name: 'dateRanges.issued.to', label: 'Issued Date <' },

  // Created date
  { name: 'dateRanges.created.from', label: 'Created Date ≥' },
  { name: 'dateRanges.created.to', label: 'Created Date <' },

  // Updated date
  { name: 'dateRanges.updated.from', label: 'Updated Date ≥' },
  { name: 'dateRanges.updated.to', label: 'Updated Date <' },

  // Expiry date
  { name: 'dateRanges.expiry.from', label: 'Expiry Date ≥' },
  { name: 'dateRanges.expiry.to', label: 'Expiry Date <' },
];

/**
 * Filter panel for Compliance Records list page.
 *
 * Matches UX and architecture of SkuFiltersPanel
 * and other list filter panels.
 */
const ComplianceFiltersPanel: FC<Props> = ({
  filters,
  lookups,
  lookupHandlers,
  onChange,
  onApply,
  onReset,
}) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<ComplianceFilters>({
      defaultValues: filters,
    });

  const { product, sku, status } = lookups;

  /** Keep external changes in sync */
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  // ---------------------------------------
  // Submit handler
  // ---------------------------------------
  const submitFilters = (data: ComplianceFilters) => {
    onChange(data);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    productFilter.reset();
    skuFilter.reset();
    
    onReset();
  };

  // -------------------------------
  // Multi-select bindings (RHF ↔ UI)
  // -------------------------------
  const {
    selectedOptions: selectedStatusOptions,
    handleSelect: handleStatusSelect,
  } = useMultiSelectBinding({
    watch,
    setValue,
    fieldName: 'statusIds',
    options: status.options,
  });

  // -------------------------------
  // Derived lookup options
  // -------------------------------
  const formattedStatusOptions = useFormattedOptions(
    status.options,
    formatLabel
  );
  
  // ----------------------------------------
  // Product lookup controller
  // ----------------------------------------
  const productFilter = useFilterLookup({
    fieldName: 'productIds',
    lookup: product,
    watch,
    setValue,
    useSearchHandlers: useProductSearchHandlers,
  });
  
  const skuFilter = useFilterLookup({
    fieldName: 'skuIds',
    lookup: sku,
    watch,
    setValue,
    useSearchHandlers: useSkuSearchHandlers,
  });
  
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Lookup filters */}
            <ProductMultiSelectDropdown
              options={product.options}
              selectedOptions={productFilter.selectedOptions}
              onChange={productFilter.handleSelect}
              onOpen={productFilter.onOpen}
              loading={product.loading}
              paginationMeta={{
                ...product.meta,
                onFetchMore: productFilter.onFetchMore,
              }}
              inputValue={productFilter.keyword}
              onInputChange={productFilter.onInputChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <SkuMultiSelectDropdown
              options={sku.options}
              selectedOptions={skuFilter.selectedOptions}
              onChange={skuFilter.handleSelect}
              onOpen={skuFilter.onOpen}
              loading={sku.loading}
              paginationMeta={{
                ...sku.meta,
                onFetchMore: skuFilter.onFetchMore,
              }}
              inputValue={skuFilter.keyword}
              onInputChange={skuFilter.onInputChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <StatusMultiSelectDropdown
              options={formattedStatusOptions}
              selectedOptions={selectedStatusOptions}
              onChange={handleStatusSelect}
              onOpen={lookupHandlers.onOpen.status}
            />
          </Grid>

          {/* ------------------------------------
           * Text-based filters
           * ------------------------------------ */}
          {TEXT_FIELDS.map(({ name, label, placeholder }) =>
            renderInputField(control, name, label, placeholder)
          )}

          {/* ------------------------------------
           * Date range filters (optional, grouped)
           * ------------------------------------ */}
          {COMPLIANCE_DATE_FIELDS.map(({ name, label }) =>
            renderDateField(control, name, label)
          )}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default ComplianceFiltersPanel;
