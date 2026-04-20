import { type FC, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import { renderDateField, renderInputField, renderNumericField } from '@utils/filters/filterUtils';
import {
  // useInventoryStatusLookup,
  usePackagingMaterialLookup,
  useProductLookup,
  useSkuLookup,
} from '@hooks/index';
import type { WarehouseInventoryFilters } from '@features/warehouseInventory';
import {
  // InventoryStatusDropdown,
  PackagingMaterialDropdown,
  ProductDropdown,
  SkuDropdown,
} from '@features/lookup/components';
import {
  PackagingMaterialLookupQueryParams,
  ProductLookupParams,
  SkuLookupQueryParams,
} from '@features/lookup';
import { useFilterFormSync } from '@utils/filters/useFilterFormSync';
import { toISODate } from '@utils/dateTimeUtils';

// =========================================================
// Types
// =========================================================

interface WarehouseInventoryFiltersPanelLookups {
  // inventoryStatus: ReturnType<typeof useInventoryStatusLookup>;
  product: ReturnType<typeof useProductLookup>;
  sku: ReturnType<typeof useSkuLookup>;
  packagingMaterial: ReturnType<typeof usePackagingMaterialLookup>;
}

interface WarehouseInventoryLookupHandlers {
  // todo:
  onOpen: {
    // inventoryStatus: () => void;
    product: () => void;
    sku: () => void;
    packagingMaterial: () => void;
  };
}

interface Props {
  filters: WarehouseInventoryFilters;
  lookups: WarehouseInventoryFiltersPanelLookups;
  lookupHandlers: WarehouseInventoryLookupHandlers;
  onChange: (filters: WarehouseInventoryFilters) => void;
  onFilterChange?: (filters: WarehouseInventoryFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

// =========================================================
// Defaults
// =========================================================

const emptyFilters: WarehouseInventoryFilters = {
  search:              '',
  batchType:           undefined,
  statusId:            undefined,
  skuId:               undefined,
  productId:           undefined,
  packagingMaterialId: undefined,
  lowStockThreshold:   undefined,
  expiringWithinDays:  undefined,
  inboundDateAfter:    undefined,
  inboundDateBefore:   undefined,
  hasReserved:         undefined,
};

// =========================================================
// Component
// =========================================================

/**
 * Filter panel for the warehouse inventory list page.
 *
 * Provides filtering by:
 * - batch type (product vs packaging material)
 * - inventory status
 * - product, SKU, packaging material (UUID lookups)
 * - inbound date range
 * - low-stock threshold, expiring-within-days, has-reserved flag
 * - full-text search
 */
const WarehouseInventoryFiltersPanel: FC<Props> = ({
                                                     filters,
                                                     lookups,
                                                     lookupHandlers,
                                                     onChange,
                                                     onFilterChange,
                                                     onApply,
                                                     onReset,
                                                   }) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<WarehouseInventoryFilters>({ defaultValues: filters });
  
  const watchedValues = watch();
  
  const {
    // inventoryStatus,
    product,
    sku,
    packagingMaterial,
  } = lookups;
  
  // -------------------------
  // Product lookup: keyword fetch
  // -------------------------
  // todo: ajdust to array
  const [productFetchParams, setProductFetchParams] = useState<ProductLookupParams>({
    offset: 0,
    limit: 10,
  });
  
  const handleProductInputChange = useCallback(
    (_: unknown, newValue: string, reason: string) => {
      if (reason !== 'input') return;
      const nextParams = { ...productFetchParams, keyword: newValue, offset: 0 };
      setProductFetchParams(nextParams);
      product.fetch(nextParams);
    },
    [productFetchParams, product.fetch]
  );
  
  // -------------------------
  // SKU lookup: keyword fetch
  // -------------------------
  const [skuFetchParams, setSkuFetchParams] = useState<SkuLookupQueryParams>({
    offset: 0,
    limit: 10,
  });
  
  const handleSkuInputChange = useCallback(
    (_: unknown, newValue: string, reason: string) => {
      if (reason !== 'input') return;
      const nextParams = { ...skuFetchParams, keyword: newValue, offset: 0 };
      setSkuFetchParams(nextParams);
      sku.fetch(nextParams);
    },
    [skuFetchParams, sku.fetch]
  );
  
  // -------------------------
  // Packaging material lookup: keyword fetch
  // -------------------------
  const [packagingMaterialFetchParams, setPackagingMaterialFetchParams] =
    useState<PackagingMaterialLookupQueryParams>({ offset: 0, limit: 10 });
  
  const handlePackagingMaterialInputChange = useCallback(
    (_: unknown, newValue: string, reason: string) => {
      if (reason !== 'input') return;
      const nextParams = { ...packagingMaterialFetchParams, keyword: newValue, offset: 0 };
      setPackagingMaterialFetchParams(nextParams);
      packagingMaterial.fetch(nextParams);
    },
    [packagingMaterialFetchParams, packagingMaterial.fetch]
  );
  
  useFilterFormSync(watchedValues, filters, reset, onFilterChange);
  
  // -------------------------
  // Submit / Reset
  // -------------------------
  const submitFilters = (data: WarehouseInventoryFilters) => {
    onChange({
      ...data,
      search:              data.search              || undefined,
      lowStockThreshold:   data.lowStockThreshold   || undefined,
      expiringWithinDays:  data.expiringWithinDays  || undefined,
      inboundDateAfter:    toISODate(data.inboundDateAfter || undefined),
      inboundDateBefore:   toISODate(data.inboundDateBefore || undefined),
    });
    onApply();
  };
  
  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };
  
  // -------------------------
  // Render
  // -------------------------
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          {/* Batch type */}
          {/*<Grid size={{ xs: 12, md: 6 }}>*/}
          {/*  <BatchTypeDropdown*/}
          {/*    value={watch('batchType') ?? null}*/}
          {/*    onChange={(val) => setValue('batchType', val ?? undefined, { shouldDirty: true })}*/}
          {/*  />*/}
          {/*</Grid>*/}
          
          {/* Inventory status */}
          {/*<Grid size={{ xs: 12, md: 6 }}>*/}
          {/*  <InventoryStatusDropdown*/}
          {/*    options={inventoryStatus.options}*/}
          {/*    value={watch('statusId') ?? null}*/}
          {/*    onChange={(val) => setValue('statusId', val ?? undefined, { shouldDirty: true })}*/}
          {/*    onOpen={lookupHandlers.onOpen.inventoryStatus}*/}
          {/*    loading={inventoryStatus.loading}*/}
          {/*  />*/}
          {/*</Grid>*/}
          
          {/* Product */}
          <Grid size={{ xs: 12, md: 6 }}>
            <ProductDropdown
              options={product.options}
              value={watch('productId') ?? null}
              onChange={(val) => setValue('productId', val ?? undefined, { shouldDirty: true })}
              onOpen={lookupHandlers.onOpen.product}
              loading={product.loading}
              paginationMeta={product.meta}
              fetchParams={productFetchParams}
              setFetchParams={setProductFetchParams}
              onRefresh={product.fetch}
              onInputChange={handleProductInputChange}
            />
          </Grid>
          
          {/* SKU */}
          <Grid size={{ xs: 12, md: 6 }}>
            <SkuDropdown
              options={sku.options}
              value={watch('skuId') ?? null}
              onChange={(val) => setValue('skuId', val ?? undefined, { shouldDirty: true })}
              onOpen={lookupHandlers.onOpen.sku}
              loading={sku.loading}
              paginationMeta={sku.meta}
              fetchParams={skuFetchParams}
              setFetchParams={setSkuFetchParams}
              onRefresh={sku.fetch}
              onInputChange={handleSkuInputChange}
            />
          </Grid>
          
          {/* Packaging material */}
          <Grid size={{ xs: 12, md: 6 }}>
            <PackagingMaterialDropdown
              options={packagingMaterial.options}
              value={watch('packagingMaterialId') ?? null}
              onChange={(val) => setValue('packagingMaterialId', val ?? undefined, { shouldDirty: true })}
              onOpen={lookupHandlers.onOpen.packagingMaterial}
              loading={packagingMaterial.loading}
              paginationMeta={packagingMaterial.meta}
              fetchParams={packagingMaterialFetchParams}
              setFetchParams={setPackagingMaterialFetchParams}
              onRefresh={packagingMaterial.fetch}
              onInputChange={handlePackagingMaterialInputChange}
            />
          </Grid>
          
          {/* Inbound date range */}
          {renderDateField(control, 'inboundDateAfter',  'Inbound After')}
          {renderDateField(control, 'inboundDateBefore', 'Inbound Before')}
          
          {/* Numeric filters */}
          {renderNumericField(control, 'lowStockThreshold',  'Low Stock ≤',     'e.g. 10')}
          {renderNumericField(control, 'expiringWithinDays', 'Expires Within',  'e.g. 30 days')}
          
          {/* Search */}
          {renderInputField(control, 'search', 'Search', 'Lot, product, SKU, material code…')}
          
          {/*{renderCheckboxField(control, 'hasReserved', 'Has Reserved')}*/}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default WarehouseInventoryFiltersPanel;
