import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import { renderDateField, renderInputField } from '@utils/filters/filterUtils';
import { formatLabel } from '@utils/textUtils';
import { toISODate } from '@utils/dateTimeUtils';
import type {
  PackagingMaterialBatchFilters,
} from '@features/packagingMaterialBatch/state';
import {
  PackagingMaterialMultiSelectDropdown,
  SupplierMultiSelectDropdown,
  StatusMultiSelectDropdown,
} from '@features/lookup/components';
import type {
  usePackagingMaterialLookup,
  useSupplierLookup,
  useStatusLookup,
} from '@hooks/index';
import {
  useFilterLookup,
  useMultiSelectBinding,
  useSupplierSearchHandlers,
  usePackagingMaterialSearchHandlers,
} from '@features/lookup/hooks';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';

/* =========================================================
 * Types
 * ======================================================= */

interface PackagingMaterialBatchFiltersPanelLookups {
  packagingMaterial: ReturnType<typeof usePackagingMaterialLookup>;
  supplier: ReturnType<typeof useSupplierLookup>;
  status: ReturnType<typeof useStatusLookup>;
}

interface PackagingMaterialBatchLookupHandlers {
  onOpen: {
    status: () => void;
    supplier: () => void;
    packagingMaterial: () => void;
  };
}

interface Props {
  filters: PackagingMaterialBatchFilters;
  lookups: PackagingMaterialBatchFiltersPanelLookups;
  lookupHandlers: PackagingMaterialBatchLookupHandlers;
  onChange: (filters: PackagingMaterialBatchFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

/* =========================================================
 * Defaults
 * ======================================================= */

const emptyFilters: PackagingMaterialBatchFilters = {
  statusIds: undefined,
  packagingMaterialIds: undefined,
  supplierIds: undefined,
  lotNumber: '',
  expiryAfter: '',
  expiryBefore: '',
  manufactureAfter: '',
  manufactureBefore: '',
  receivedAfter: '',
  receivedBefore: '',
  createdAfter: '',
  createdBefore: '',
  keyword: '',
};

interface DateField {
  name:
    | 'expiryAfter'
    | 'expiryBefore'
    | 'manufactureAfter'
    | 'manufactureBefore'
    | 'receivedAfter'
    | 'receivedBefore'
    | 'createdAfter'
    | 'createdBefore';
  label: string;
}

const DATE_FIELDS: DateField[] = [
  { name: 'expiryAfter', label: 'Expiry Date ≥' },
  { name: 'expiryBefore', label: 'Expiry Date <' },
  
  { name: 'manufactureAfter', label: 'Manufacture Date ≥' },
  { name: 'manufactureBefore', label: 'Manufacture Date <' },
  
  { name: 'receivedAfter', label: 'Received Date ≥' },
  { name: 'receivedBefore', label: 'Received Date <' },
  
  { name: 'createdAfter', label: 'Created Date ≥' },
  { name: 'createdBefore', label: 'Created Date <' },
];

/* =========================================================
 * Component
 * ======================================================= */

/**
 * Filter panel for Packaging Material Batch list page.
 *
 * Provides filtering by:
 * - packaging material
 * - supplier
 * - lot number
 * - lifecycle date ranges
 * - audit creation dates
 * - status
 * - keyword search
 */
const PackagingMaterialBatchFiltersPanel: FC<Props> = ({
                                                         filters,
                                                         lookups,
                                                         lookupHandlers,
                                                         onChange,
                                                         onApply,
                                                         onReset,
                                                       }) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<PackagingMaterialBatchFilters>({
      defaultValues: filters,
    });
  
  const { packagingMaterial, supplier, status } = lookups;
  
  /* -----------------------------
   * Lookup bindings
   * --------------------------- */
  
  const packagingMaterialFilter = useFilterLookup({
    fieldName: 'packagingMaterialIds',
    lookup: packagingMaterial,
    watch,
    setValue,
    useSearchHandlers: usePackagingMaterialSearchHandlers,
  });
  
  const supplierFilter = useFilterLookup({
    fieldName: 'supplierIds',
    lookup: supplier,
    watch,
    setValue,
    useSearchHandlers: useSupplierSearchHandlers,
  });
  
  /* -----------------------------
   * Sync external filters
   * --------------------------- */
  
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
  
  /* -----------------------------
   * Submit / Reset
   * --------------------------- */
  
  const submitFilters = (data: PackagingMaterialBatchFilters) => {
    const adjusted: PackagingMaterialBatchFilters = {
      ...data,
      lotNumber: data.lotNumber || undefined,
      keyword: data.keyword || undefined,
      
      expiryAfter: toISODate(data.expiryAfter),
      expiryBefore: toISODate(data.expiryBefore),
      manufactureAfter: toISODate(data.manufactureAfter),
      manufactureBefore: toISODate(data.manufactureBefore),
      receivedAfter: toISODate(data.receivedAfter),
      receivedBefore: toISODate(data.receivedBefore),
      createdAfter: toISODate(data.createdAfter),
      createdBefore: toISODate(data.createdBefore),
    };
    
    onChange(adjusted);
    onApply();
  };
  
  const resetFilters = () => {
    reset(emptyFilters);
    
    packagingMaterialFilter.reset();
    supplierFilter.reset();
    
    onReset();
  };
  
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
   * Render
   * --------------------------- */
  
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <PackagingMaterialMultiSelectDropdown
              options={packagingMaterial.options}
              selectedOptions={packagingMaterialFilter.selectedOptions}
              onChange={packagingMaterialFilter.handleSelect}
              onOpen={lookupHandlers.onOpen.packagingMaterial}
              loading={packagingMaterial.loading}
              paginationMeta={{
                ...packagingMaterial.meta,
                onFetchMore: packagingMaterialFilter.onFetchMore,
              }}
              inputValue={packagingMaterialFilter.keyword}
              onInputChange={packagingMaterialFilter.onInputChange}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <SupplierMultiSelectDropdown
              options={supplier.options}
              selectedOptions={supplierFilter.selectedOptions}
              onChange={supplierFilter.handleSelect}
              onOpen={lookupHandlers.onOpen.supplier}
              loading={supplier.loading}
              paginationMeta={{
                ...supplier.meta,
                onFetchMore: supplierFilter.onFetchMore,
              }}
              inputValue={supplierFilter.keyword}
              onInputChange={supplierFilter.onInputChange}
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
          
          {/* Keyword */}
          {renderInputField(
            control,
            'keyword',
            'Keyword',
            'Lot, material, supplier'
          )}
          
          {/* Lot */}
          {renderInputField(control, 'lotNumber', 'Lot Number')}
          
          {/* Date Ranges */}
          {DATE_FIELDS.map(({ name, label }) =>
            renderDateField(control, name, label)
          )}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default PackagingMaterialBatchFiltersPanel;
