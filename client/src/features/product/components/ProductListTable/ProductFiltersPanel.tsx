import { type FC, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import FilterPanelLayout from '@components/common/FilterPanelLayout';
import StatusMultiSelectDropdown from '@features/lookup/components/StatusMultiSelectDropdown';
import { renderInputField } from '@utils/filters/filterUtils';
import type { ProductListFilters } from '@features/product/state/productTypes';
import type { FilterField } from '@shared-types/shared';
import type { LookupOption } from '@features/lookup/state';

interface ProductFiltersPanelProps {
  filters: ProductListFilters;
  onChange: (filters: ProductListFilters) => void;
  onApply: () => void;
  onOpen: () => void;
  onReset: () => void;
  statusOptions: LookupOption[];
  statusLoading?: boolean;
  statusError?: string | null;
}

const emptyFilters: ProductListFilters = {
  keyword: '',
  brand: '',
  category: '',
  series: '',
  createdBy: '',
  updatedBy: '',
  statusIds: undefined,
};

// ---------------------------------------
// Standard text input fields
// ---------------------------------------
const TEXT_FIELDS: FilterField<ProductListFilters>[] = [
  {
    name: 'keyword',
    label: 'Keyword',
    placeholder: 'Product, Brand, Category…',
  },
  { name: 'brand', label: 'Brand' },
  { name: 'category', label: 'Category' },
  { name: 'series', label: 'Series' },
];

/**
 * Filter panel for Product List page.
 * Mirrors the UX and architecture of SkuFiltersPanel.
 */
const ProductFiltersPanel: FC<ProductFiltersPanelProps> = ({
  filters,
  onChange,
  onOpen,
  onApply,
  onReset,
  statusOptions,
  statusLoading,
  statusError,
}) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<ProductListFilters>({
      defaultValues: filters,
    });

  /** Keep external changes in sync */
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  // -------------------------------
  // Status dropdown binding
  // -------------------------------
  const statusValue = watch('statusIds');

  // Convert from string[] → MultiSelectOption[]
  const selectedStatusOptions = useMemo(() => {
    if (!Array.isArray(statusValue)) return [];

    return statusOptions
      .filter((opt) => statusValue.includes(opt.value))
      .map((opt) => ({
        value: opt.value,
        label: opt.label,
      }));
  }, [statusValue, statusOptions]);

  // Convert from MultiSelectOption[] → string[]
  const handleStatusSelect = (options: { value: string; label: string }[]) => {
    const ids = options.map((o) => o.value);
    setValue('statusIds', ids.length ? ids : undefined, { shouldDirty: true });
  };

  // -------------------------------
  // Submit / Reset
  // -------------------------------
  const submitFilters = (data: ProductListFilters) => {
    onChange(data);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          {/* --- Text fields --- */}
          {TEXT_FIELDS.map(({ name, label, placeholder }) =>
            renderInputField(control, name, label, placeholder)
          )}

          <StatusMultiSelectDropdown
            options={statusOptions}
            selectedOptions={selectedStatusOptions}
            onChange={handleStatusSelect}
            onOpen={onOpen}
            loading={statusLoading}
            error={statusError}
            placeholder="Select one or more statuses..."
          />
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default ProductFiltersPanel;
