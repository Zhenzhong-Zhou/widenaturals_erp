import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import FilterPanelLayout from '@components/common/FilterPanelLayout';
import {
  renderInputField,
  renderNumericField,
} from '@utils/filters/filterUtils';
import type { SkuListFilters } from '@features/sku/state/skuTypes';
import type { FilterField } from '@shared-types/shared';

interface Props {
  filters: SkuListFilters;
  onChange: (filters: SkuListFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const emptyFilters: SkuListFilters = {
  keyword: '',
  sku: '',
  productName: '',
  brand: '',
  category: '',
  marketRegion: '',
  sizeLabel: '',
  countryCode: '',
};

// ---------------------------------------
// Standard text input fields
// ---------------------------------------
const TEXT_FIELDS: FilterField<SkuListFilters>[] = [
  { name: 'keyword', label: 'Keyword', placeholder: 'SKU, Product, Brand…' },
  { name: 'productName', label: 'Product Name' },
  { name: 'brand', label: 'Brand' },
  { name: 'category', label: 'Category' },
  { name: 'sizeLabel', label: 'Size Label' },
  { name: 'marketRegion', label: 'Region' },
  { name: 'countryCode', label: 'Country Code' },
];

// ---------------------------------------
// Dimensional range filters
// ---------------------------------------
const DIMENSIONAL_FIELDS: FilterField<SkuListFilters>[] = [
  { name: 'minLengthCm', label: 'Length ≥ (cm)' },
  { name: 'maxLengthCm', label: 'Length ≤ (cm)' },
  { name: 'minLengthIn', label: 'Length ≥ (inch)' },
  { name: 'maxLengthIn', label: 'Length ≤ (inch)' },

  { name: 'minWidthCm', label: 'Width ≥ (cm)' },
  { name: 'maxWidthCm', label: 'Width ≤ (cm)' },
  { name: 'minWidthIn', label: 'Width ≥ (inch)' },
  { name: 'maxWidthIn', label: 'Width ≤ (inch)' },

  { name: 'minHeightCm', label: 'Height ≥ (cm)' },
  { name: 'maxHeightCm', label: 'Height ≤ (cm)' },
  { name: 'minHeightIn', label: 'Height ≥ (inch)' },
  { name: 'maxHeightIn', label: 'Height ≤ (inch)' },

  { name: 'minWeightG', label: 'Weight ≥ (g)' },
  { name: 'maxWeightG', label: 'Weight ≤ (g)' },
  { name: 'minWeightLb', label: 'Weight ≥ (lb)' },
  { name: 'maxWeightLb', label: 'Weight ≤ (lb)' },
];

/**
 * Filter panel for SKU List page.
 * Matches UX and architecture of BOMFiltersPanel.
 */
const SkuFiltersPanel: FC<Props> = ({
  filters,
  onChange,
  onApply,
  onReset,
}) => {
  const { control, handleSubmit, reset } = useForm<SkuListFilters>({
    defaultValues: filters,
  });

  // ---------------------------------------
  // Submit handler
  // ---------------------------------------
  const submitFilters = (data: SkuListFilters) => {
    onChange(data);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };

  /** Keep external changes in sync */
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          {/* --- Text fields --- */}
          {TEXT_FIELDS.map(({ name, label, placeholder }) =>
            renderInputField(control, name, label, placeholder)
          )}

          {/* --- Dimensional numeric fields --- */}
          {DIMENSIONAL_FIELDS.map(({ name, label }) =>
            renderNumericField(control, name, label)
          )}

          {/* --- Audit Filters (optional) --- */}
          {/*{renderInputField(control, 'createdBy', 'Created By')}*/}
          {/*{renderInputField(control, 'updatedBy', 'Updated By')}*/}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default SkuFiltersPanel;
