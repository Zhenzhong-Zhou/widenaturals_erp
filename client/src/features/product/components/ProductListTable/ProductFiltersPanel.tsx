import { type Dispatch, type FC, type SetStateAction, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import FilterPanelLayout from '@components/common/FilterPanelLayout';
import StatusMultiSelectDropdown from '@features/lookup/components/StatusMultiSelectDropdown';
import UserDropdown from '@features/lookup/components/UserDropdown';
import useMultiSelectBinding from '@features/lookup/hooks/useMultiSelectBinding';
import { renderInputField } from '@utils/filters/filterUtils';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';
import { formatLabel } from '@utils/textUtils';
import type { ProductListFilters } from '@features/product/state/productTypes';
import type { FilterField } from '@shared-types/shared';
import type {
  LookupOption,
  LookupPaginationMeta,
  UserLookupParams,
} from '@features/lookup/state';

interface ProductFiltersPanelProps {
  filters: ProductListFilters;
  onChange: (filters: ProductListFilters) => void;
  
  onApply: () => void;
  onReset: () => void;
  
  // -------------------
  // Status lookup
  // -------------------
  onStatusOpen: () => void;
  statusOptions: LookupOption[];
  statusLoading?: boolean;
  statusError?: string | null;
  
  // -------------------
  // Shared user lookup data
  // -------------------
  userOptions: LookupOption[];
  userLoading?: boolean;
  userError?: string | null;
  userMeta: LookupPaginationMeta;
  
  // -------------------
  // Created By filter
  // -------------------
  onCreatedByOpen: () => void;
  createdByFetchParams: UserLookupParams;
  setCreatedByFetchParams: Dispatch<
    SetStateAction<UserLookupParams>
  >;
  
  // -------------------
  // Updated By filter
  // -------------------
  onUpdatedByOpen: () => void;
  updatedByFetchParams: UserLookupParams;
  setUpdatedByFetchParams: Dispatch<
    SetStateAction<UserLookupParams>
  >;
  
  // -------------------
  // User lookup fetcher
  // -------------------
  fetchUserLookup: (params?: UserLookupParams) => void;
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
                                                             onApply,
                                                             onReset,
                                                             
                                                             // -------------------
                                                             // Status lookup
                                                             // -------------------
                                                             onStatusOpen,
                                                             statusOptions,
                                                             statusLoading,
                                                             statusError,
                                                             
                                                             // -------------------
                                                             // Shared user lookup
                                                             // -------------------
                                                             userOptions,
                                                             userLoading,
                                                             userError,
                                                             userMeta,
                                                             fetchUserLookup,
                                                             
                                                             // -------------------
                                                             // Created By filter
                                                             // -------------------
                                                             onCreatedByOpen,
                                                             createdByFetchParams,
                                                             setCreatedByFetchParams,
                                                             
                                                             // -------------------
                                                             // Updated By filter
                                                             // -------------------
                                                             onUpdatedByOpen,
                                                             updatedByFetchParams,
                                                             setUpdatedByFetchParams,
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
          
          <Grid size={{ xs: 4 }}>
            {/* --- Status filter --- */}
            <StatusMultiSelectDropdown
              options={formattedStatusOptions}
              selectedOptions={selectedStatusOptions}
              onChange={handleStatusSelect}
              onOpen={onStatusOpen}
              loading={statusLoading}
              error={statusError}
              placeholder="Select one or more statuses..."
            />
          </Grid>
          
          <Grid size={{ xs: 4 }}>
            {/* --- User filter --- */}
            <UserDropdown
              label="Created By"
              value={filters.createdBy ?? null}
              options={userOptions}
              loading={userLoading}
              error={userError}
              paginationMeta={userMeta}
              
              fetchParams={createdByFetchParams}
              setFetchParams={setCreatedByFetchParams}
              
              onChange={(val) => {
                setValue('createdBy', val, { shouldDirty: true });
              }}
              
              onRefresh={(params) => fetchUserLookup(params)}
              onOpen={onCreatedByOpen}
              
              onInputChange={(_, newValue, reason) => {
                if (reason !== 'input') return;
                
                setCreatedByFetchParams((prev) => ({
                  ...prev,
                  keyword: newValue,
                  offset: 0,
                }));
                
                fetchUserLookup({
                  ...createdByFetchParams,
                  keyword: newValue,
                  offset: 0,
                });
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 4 }}>
            <UserDropdown
              label="Updated By"
              value={filters.updatedBy ?? null}
              options={userOptions}
              loading={userLoading}
              error={userError}
              paginationMeta={userMeta}
              
              fetchParams={updatedByFetchParams}
              setFetchParams={setUpdatedByFetchParams}
              
              onChange={(val) => {
                setValue('updatedBy', val, { shouldDirty: true });
              }}
              
              onRefresh={(params) => fetchUserLookup(params)}
              onOpen={onUpdatedByOpen}
              
              onInputChange={(_, newValue, reason) => {
                if (reason !== 'input') return;
                
                setUpdatedByFetchParams((prev) => ({
                  ...prev,
                  keyword: newValue,
                  offset: 0,
                }));
                
                fetchUserLookup({
                  ...updatedByFetchParams,
                  keyword: newValue,
                  offset: 0,
                });
              }}
            />
          </Grid>
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default ProductFiltersPanel;
