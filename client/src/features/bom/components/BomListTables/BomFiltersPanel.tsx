import { type FC, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import FilterPanelLayout from '@components/common/FilterPanelLayout';
import {
  renderBooleanSelectField,
  renderInputField,
} from '@utils/filters/filterUtils';
import type { BomListFilters } from '@features/bom/state';
import useSkuLookup from '@hooks/useSkuLookup';
import SkuDropdown from '@features/lookup/components/SkuDropdown';
import { createDropdownBundle } from '@utils/lookupHelpers';
import type { SkuLookupQueryParams } from '@features/lookup/state';

interface Props {
  filters: BomListFilters;
  onChange: (filters: BomListFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

/** Empty baseline filter values */
const emptyFilters: BomListFilters = {
  keyword: '',
  skuId: '',
  complianceType: '',
  complianceStatusId: '',
  statusId: '',
  isActive: undefined,
  isDefault: undefined,
  revisionMin: undefined,
  revisionMax: undefined,
  createdBy: '',
  updatedBy: '',
};

/**
 * Filter panel for BOM list page.
 *
 * Provides filtering by product, SKU, brand, category, compliance type, and revision.
 * Follows same UX pattern as InventoryAllocationFiltersPanel.
 */
const BomFiltersPanel: FC<Props> = ({
  filters,
  onChange,
  onApply,
  onReset,
}) => {
  const [showBarcode, setShowBarcode] = useState(false);

  const { control, handleSubmit, reset } = useForm<BomListFilters>({
    defaultValues: filters,
  });

  const {
    options: skuOptions,
    loading: isSkuLoading,
    error: skuError,
    meta: skuMeta,
    fetch: fetchSkuLookup,
    reset: resetSkuLookup,
  } = useSkuLookup();

  const skuDropdown = createDropdownBundle<SkuLookupQueryParams>({
    includeBarcode: true,
  });

  const { fetchParams: skuFetchParams, setFetchParams: setSkuFetchParams } =
    skuDropdown;

  // --- Fetch all dropdown lookups on mount ---
  useEffect(() => {
    // Initial fetch on mount
    resetSkuLookup();

    fetchSkuLookup({
      ...skuFetchParams,
      keyword: skuFetchParams.keyword ?? '',
      includeBarcode: showBarcode,
    });
    return () => resetSkuLookup();
  }, []);

  useEffect(() => {
    setSkuFetchParams((prev) => ({
      ...prev,
      includeBarcode: showBarcode,
      offset: 0,
    }));
    fetchSkuLookup({
      ...skuFetchParams,
      includeBarcode: showBarcode,
      offset: 0,
    });
  }, [showBarcode]);

  // --- Input and range fields ---
  const textFields: {
    name: keyof BomListFilters;
    label: string;
    placeholder?: string;
  }[] = [
    {
      name: 'keyword',
      label: 'Keyword',
      placeholder: 'BOM name, code or description',
    },
    { name: 'revisionMin', label: 'Revision ≥' },
    { name: 'revisionMax', label: 'Revision ≤' },
    // { name: 'createdBy', label: 'Created By' },
    // { name: 'updatedBy', label: 'Updated By' },
  ];

  // --- Submit & Reset ---
  const submitFilters = (data: BomListFilters) => {
    const adjusted = {
      ...data,
      revisionMin: data.revisionMin ?? undefined,
      revisionMax: data.revisionMax ?? undefined,
    };
    onChange(adjusted);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };

  // Keep external filter sync
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  // --- Render ---
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          {/*  /!* --- Sku --- *!/*/}
          <Grid size={{ xs: 12 }}>
            <Controller
              name="showBarcode"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        field.onChange(checked);
                        setShowBarcode?.(checked);
                      }}
                      color="primary"
                    />
                  }
                  label="Show Barcode"
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 8 }}>
            <Controller
              name="skuId"
              control={control}
              render={({ field, fieldState }) => (
                <SkuDropdown
                  value={field.value ?? null}
                  onChange={(val) => field.onChange(val ?? '')}
                  options={skuOptions} // from useSkuLookup
                  loading={isSkuLoading}
                  error={skuError}
                  helperText={fieldState.error?.message || skuError?.message}
                  paginationMeta={skuMeta} // for infinite scroll
                  fetchParams={skuFetchParams}
                  setFetchParams={setSkuFetchParams}
                  onRefresh={(params) => fetchSkuLookup(params)} // manual reload
                  label="Search or Select SKU"
                  onInputChange={(_, newValue, reason) => {
                    if (reason !== 'input') return;
                    // keyword search on typing
                    setSkuFetchParams((prev) => ({
                      ...prev,
                      keyword: newValue,
                      offset: 0,
                      includeBarcode: showBarcode,
                    }));
                    fetchSkuLookup({
                      ...skuFetchParams,
                      keyword: newValue,
                      offset: 0,
                      includeBarcode: showBarcode,
                    });
                  }}
                />
              )}
            />
          </Grid>

          {/* --- Text fields --- */}
          {textFields.map(({ name, label, placeholder }) =>
            renderInputField(control, name, label, placeholder)
          )}

          {/* --- Boolean Flags --- */}
          {renderBooleanSelectField(control, 'isActive', 'Active')}
          {renderBooleanSelectField(control, 'isDefault', 'Default')}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default BomFiltersPanel;
