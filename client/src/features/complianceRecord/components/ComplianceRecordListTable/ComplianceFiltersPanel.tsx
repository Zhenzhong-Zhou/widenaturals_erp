import { type FC, useCallback, useEffect, useState } from 'react';
import { Path, useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import FilterPanelLayout from '@components/common/FilterPanelLayout';
import { renderDateField, renderInputField } from '@utils/filters/filterUtils';
import { ComplianceFilters } from '@features/complianceRecord/state';
import type { FilterField } from '@shared-types/shared';
import useProductLookup from '@hooks/useProductLookup';
import useSkuLookup from '@hooks/useSkuLookup';
import useStatusLookup from '@hooks/useStatusLookup';
import useMultiSelectBinding from '@features/lookup/hooks/useMultiSelectBinding';
import useProductSearchHandlers from '@features/lookup/hooks/useProductSearchHandlers';
import useSkuSearchHandlers from '@features/lookup/hooks/useSkuSearchHandlers';
import StatusMultiSelectDropdown from '@features/lookup/components/StatusMultiSelectDropdown';
import ProductMultiSelectDropdown from '@features/lookup/components/ProductMultiSelectDropdown';
import SkuMultiSelectDropdown from '@features/lookup/components/SkuMultiSelectDropdown';
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
  { name: 'dateRanges.issued.to', label: 'Issued Date ≤' },

  // Created date
  { name: 'dateRanges.created.from', label: 'Created Date ≥' },
  { name: 'dateRanges.created.to', label: 'Created Date ≤' },

  // Updated date
  { name: 'dateRanges.updated.from', label: 'Updated Date ≥' },
  { name: 'dateRanges.updated.to', label: 'Updated Date ≤' },

  // Expiry date
  { name: 'dateRanges.expiry.from', label: 'Expiry Date ≥' },
  { name: 'dateRanges.expiry.to', label: 'Expiry Date ≤' },
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

  const [productKeyword, setProductKeyword] = useState('');
  const [skuKeyword, setSkuKeyword] = useState('');

  const { product, sku, status } = lookups;

  /** Keep external changes in sync */
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  // -------------------------------
  // Reset search keywords when options reset
  // -------------------------------
  useEffect(() => {
    if (!product.options.length) {
      setProductKeyword('');
    }
  }, [product.options.length]);

  useEffect(() => {
    if (!sku.options.length) {
      setSkuKeyword('');
    }
  }, [sku.options.length]);

  // ---------------------------------------
  // Submit handler
  // ---------------------------------------
  const submitFilters = (data: ComplianceFilters) => {
    onChange(data);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    setProductKeyword('');
    setSkuKeyword('');
    onReset();
  };

  // -------------------------------
  // Multi-select bindings (RHF ↔ UI)
  // -------------------------------
  const {
    selectedOptions: selectedProductOptions,
    handleSelect: handleProductSelect,
  } = useMultiSelectBinding({
    watch,
    setValue,
    fieldName: 'productIds',
    options: product.options,
  });

  const { selectedOptions: selectedSkuOptions, handleSelect: handleSkuSelect } =
    useMultiSelectBinding({
      watch,
      setValue,
      fieldName: 'skuIds',
      options: sku.options,
    });

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

  // -------------------------------
  // Product lookup search & pagination
  // -------------------------------
  const handleProductOpen = useCallback(() => {
    if (!product.options.length) {
      product.fetch({ keyword: productKeyword, offset: 0 });
    }
  }, [product.fetch, product.options.length, productKeyword]);

  const handleFetchMoreProducts = useCallback(
    (next?: { limit?: number; offset?: number }) => {
      product.fetch({
        keyword: productKeyword || '',
        limit: next?.limit,
        offset: next?.offset,
      });
    },
    [product.fetch, productKeyword]
  );

  const { handleProductSearch } = useProductSearchHandlers(product);

  const handleProductInputChange = useCallback(
    (value: string) => {
      setProductKeyword(value);
      handleProductSearch(value); // debounced
    },
    [handleProductSearch]
  );

  // -------------------------------
  // SKU lookup search & pagination
  // -------------------------------
  const handleSkuOpen = useCallback(() => {
    if (!sku.options.length) {
      sku.fetch({ keyword: skuKeyword, offset: 0 });
    }
  }, [sku.fetch, sku.options.length, skuKeyword]);

  const handleFetchMoreSkus = useCallback(
    (next?: { limit?: number; offset?: number }) => {
      sku.fetch({
        keyword: skuKeyword || '',
        limit: next?.limit,
        offset: next?.offset,
      });
    },
    [sku.fetch, skuKeyword]
  );

  const { handleSkuSearch } = useSkuSearchHandlers(sku);

  const handleSkuInputChange = useCallback(
    (value: string) => {
      setSkuKeyword(value);
      handleSkuSearch(value); // debounced
    },
    [handleSkuSearch]
  );

  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Lookup filters */}
            <ProductMultiSelectDropdown
              options={product.options}
              selectedOptions={selectedProductOptions}
              onChange={handleProductSelect}
              onOpen={handleProductOpen}
              loading={product.loading}
              paginationMeta={{
                ...product.meta,
                onFetchMore: handleFetchMoreProducts,
              }}
              inputValue={productKeyword}
              onInputChange={handleProductInputChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <SkuMultiSelectDropdown
              options={sku.options}
              selectedOptions={selectedSkuOptions}
              onChange={handleSkuSelect}
              onOpen={handleSkuOpen}
              loading={sku.loading}
              paginationMeta={{
                ...sku.meta,
                onFetchMore: handleFetchMoreSkus,
              }}
              inputValue={skuKeyword}
              onInputChange={handleSkuInputChange}
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
