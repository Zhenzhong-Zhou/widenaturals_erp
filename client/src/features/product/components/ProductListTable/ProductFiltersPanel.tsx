import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import {
  StatusMultiSelectDropdown,
  UserDropdown,
} from '@features/lookup/components';
import {
  useMultiSelectBinding,
  useUserLookupBinding,
} from '@features/lookup/hooks';
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
}) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<ProductListFilters>({
      defaultValues: filters,
    });

  const createdByLookup = useUserLookupBinding({
    fetchUserLookup,
  });

  const updatedByLookup = useUserLookupBinding({
    fetchUserLookup,
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

  const handleCreatedByOpen = () => {
    if (!userOptions.length) {
      createdByLookup.handleRefresh();
    }
  };

  const handleUpdatedByOpen = () => {
    if (!userOptions.length) {
      updatedByLookup.handleRefresh();
    }
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
              fetchParams={createdByLookup.fetchParams}
              setFetchParams={createdByLookup.setFetchParams}
              onChange={(val) =>
                setValue('createdBy', val, { shouldDirty: true })
              }
              onRefresh={createdByLookup.handleRefresh}
              onOpen={handleCreatedByOpen}
              onInputChange={createdByLookup.handleInputChange}
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
              fetchParams={updatedByLookup.fetchParams}
              setFetchParams={updatedByLookup.setFetchParams}
              onChange={(val) =>
                setValue('updatedBy', val, { shouldDirty: true })
              }
              onRefresh={updatedByLookup.handleRefresh}
              onOpen={handleUpdatedByOpen}
              onInputChange={updatedByLookup.handleInputChange}
            />
          </Grid>
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default ProductFiltersPanel;
