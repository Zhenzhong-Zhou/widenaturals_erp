import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import FilterPanelLayout from '@components/common/FilterPanelLayout';
import StatusMultiSelectDropdown from '@features/lookup/components/StatusMultiSelectDropdown';
import { renderInputField } from '@utils/filters/filterUtils';
import type { ProductListFilters } from '@features/product/state/productTypes';
import type { FilterField } from '@shared-types/shared';
import type { LookupOption } from '@features/lookup/state';
import useMultiSelectBinding from '@features/lookup/hooks/useMultiSelectBinding';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';
import { formatLabel } from '@utils/textUtils';

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
  const {
    selectedOptions: selectedStatusOptions,
    handleSelect: handleStatusSelect,
  } = useMultiSelectBinding({
    watch,
    setValue,
    fieldName: 'statusIds',
    options: statusOptions,
  });
  
  const formattedStatusOptions = useFormattedOptions(
    statusOptions,
    formatLabel
  );
  
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
            options={formattedStatusOptions}
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
