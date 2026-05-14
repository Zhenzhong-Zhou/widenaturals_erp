import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import {
  InventoryActionTypeDropdown,
  LotAdjustmentTypeDropdown,
  UserDropdown,
} from '@features/lookup/components';
import {
  renderDateField,
  renderSelectField,
} from '@utils/filters/filterUtils';
import {
  useInventoryActionTypeLookupBinding,
  useLotAdjustmentTypeLookupBinding,
  useUserLookupBinding,
} from '@features/lookup/hooks';
import { toISODate } from '@utils/dateTimeUtils';
import type { OptionType } from '@components/common/Dropdown';
import type { InventoryActivityLogFilters } from '@features/warehouseInventory';
import {
  InventoryActionTypeLookupParams,
  LookupOption,
  LookupPaginationMeta,
  LotAdjustmentTypeLookupParams,
  UserLookupParams,
} from '@features/lookup';

/* =========================================================
 * Types
 * ======================================================= */

interface Props {
  filters: InventoryActivityLogFilters;
  onChange: (filters: InventoryActivityLogFilters) => void;
  onApply: () => void;
  onReset: () => void;
  
  inventoryActionTypeOptions: LookupOption[];
  inventoryActionTypeLoading?: boolean;
  inventoryActionTypeError?: string | null;
  inventoryActionTypeMeta: LookupPaginationMeta;
  
  fetchInventoryActionTypeLookup: (
    params?: InventoryActionTypeLookupParams
  ) => void;
  
  adjustmentTypeOptions: LookupOption[];
  adjustmentTypeLoading?: boolean;
  adjustmentTypeError?: string | null;
  adjustmentTypeMeta: LookupPaginationMeta;
  
  fetchLotAdjustmentTypeLookup: (
    params?: LotAdjustmentTypeLookupParams
  ) => void;
  
  userOptions: LookupOption[];
  userLoading?: boolean;
  userError?: string | null;
  userMeta: LookupPaginationMeta;
  
  fetchUserLookup: (
    params?: UserLookupParams
  ) => void;
}

/* =========================================================
 * Defaults
 * ======================================================= */

const emptyFilters: InventoryActivityLogFilters = {
  inventoryId: undefined,
  actionTypeId: undefined,
  adjustmentTypeId: undefined,
  referenceType: undefined,
  performedBy: undefined,
  performedAtAfter: undefined,
  performedAtBefore: undefined,
};

const REFERENCE_TYPE_OPTIONS: OptionType[] = [
  { label: 'Order', value: 'order' },
  { label: 'Fulfillment', value: 'fulfillment' },
];

/* =========================================================
 * Component
 * ======================================================= */

/**
 * Filter panel for inventory activity log search.
 *
 * Supports both:
 * - full activity log pages, where `inventoryId` is not present
 * - inventory-scoped activity log pages, where `inventoryId` is supplied
 *   externally by the parent page, URL state, or header chip
 *
 * Exposes:
 * - inventory action type
 * - lot adjustment type
 * - reference type
 * - performed-by user
 * - performed-at date range
 *
 * `inventoryId` is intentionally not rendered as an editable field here.
 * When present, it is treated as an external scope filter and is preserved
 * during submit/reset. When absent, it is removed from submitted filters so
 * the full activity log page remains unscoped.
 *
 * Single-value lookup fields use dedicated dropdown components with their
 * own paginated lookup bindings and direct `setValue` wiring.
 */
const WarehouseInventoryActivityLogFilterPanel: FC<Props> = ({
                                                               filters,
                                                               onChange,
                                                               onApply,
                                                               onReset,
                                                               inventoryActionTypeOptions,
                                                               inventoryActionTypeLoading,
                                                               inventoryActionTypeError,
                                                               inventoryActionTypeMeta,
                                                               fetchInventoryActionTypeLookup,
                                                               adjustmentTypeOptions,
                                                               adjustmentTypeLoading,
                                                               adjustmentTypeError,
                                                               adjustmentTypeMeta,
                                                               fetchLotAdjustmentTypeLookup,
                                                               userOptions,
                                                               userLoading,
                                                               userError,
                                                               userMeta,
                                                               fetchUserLookup,
                                                             }) => {
  const { control, handleSubmit, reset, setValue } =
    useForm<InventoryActivityLogFilters>({
      defaultValues: filters,
    });
  
  // Keep the form aligned with external filter changes (e.g., the page's
  // "Clear Filters" button, or a chip-driven inventoryId removal).
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
  
  /* -----------------------------
   * Lookup bindings
   * --------------------------- */
  
  const inventoryActionTypeBinding = useInventoryActionTypeLookupBinding({
    fetchInventoryActionTypeLookup,
  });
  
  const adjustmentTypeBinding = useLotAdjustmentTypeLookupBinding({
    fetchLotAdjustmentTypeLookup,
  });
  
  const performedByBinding = useUserLookupBinding({
    fetchUserLookup,
  });
  
  const handleInventoryActionTypeOpen = () => {
    if (!inventoryActionTypeOptions.length) {
      inventoryActionTypeBinding.handleRefresh();
    }
  };
  
  const handlePerformedByOpen = () => {
    if (!userOptions.length) {
      performedByBinding.handleRefresh();
    }
  };
  
  const handleLotAdjustmentOpen = () => {
    if (!adjustmentTypeOptions.length) {
      adjustmentTypeBinding.handleRefresh();
    }
  };
  
  /* -----------------------------
   * Submit / Reset
   * --------------------------- */
  
  const submitFilters = (data: InventoryActivityLogFilters) => {
    const adjusted: InventoryActivityLogFilters = {
      ...data,
      performedAtAfter: toISODate(data.performedAtAfter || undefined),
      performedAtBefore: toISODate(data.performedAtBefore || undefined),
    };
    
    // Keep inventoryId only for inventory-scoped log pages.
    // Full log pages should submit without inventoryId.
    if (filters.inventoryId) {
      adjusted.inventoryId = filters.inventoryId;
    } else {
      delete adjusted.inventoryId;
    }
    
    onChange(adjusted);
    onApply();
  };
  
  const resetFilters = () => {
    const nextFilters: InventoryActivityLogFilters = {
      ...emptyFilters,
    };
    
    // Keep inventory scope during reset only when the parent page supplied one.
    if (filters.inventoryId) {
      nextFilters.inventoryId = filters.inventoryId;
    }
    
    reset(nextFilters);
    onChange(nextFilters);
    onReset();
  };
  
  /* -----------------------------
   * Render
   * --------------------------- */
  
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          {/* --- Inventory action type --- */}
          <Grid size={{ xs: 12, md: 4 }}>
            <InventoryActionTypeDropdown
              label="Action Type"
              value={filters.actionTypeId ?? null}
              options={inventoryActionTypeOptions}
              loading={inventoryActionTypeLoading}
              error={inventoryActionTypeError}
              paginationMeta={inventoryActionTypeMeta}
              fetchParams={inventoryActionTypeBinding.fetchParams}
              setFetchParams={inventoryActionTypeBinding.setFetchParams}
              onChange={(val) =>
                setValue('actionTypeId', val ?? undefined, {
                  shouldDirty: true,
                })
              }
              onRefresh={inventoryActionTypeBinding.handleRefresh}
              onOpen={handleInventoryActionTypeOpen}
              onInputChange={inventoryActionTypeBinding.handleInputChange}
            />
          </Grid>
          
          {/* --- Adjustment type --- */}
          <Grid size={{ xs: 12, md: 4 }}>
            <LotAdjustmentTypeDropdown
              label="Adjustment Type"
              value={filters.adjustmentTypeId ?? null}
              options={adjustmentTypeOptions}
              loading={adjustmentTypeLoading}
              error={adjustmentTypeError}
              paginationMeta={adjustmentTypeMeta}
              fetchParams={adjustmentTypeBinding.fetchParams}
              setFetchParams={adjustmentTypeBinding.setFetchParams}
              onChange={(val) =>
                setValue('adjustmentTypeId', val ?? undefined, {
                  shouldDirty: true,
                })
              }
              onRefresh={adjustmentTypeBinding.handleRefresh}
              onOpen={handleLotAdjustmentOpen}
              onInputChange={adjustmentTypeBinding.handleInputChange}
            />
          </Grid>
          
          {/* --- Performed by --- */}
          <Grid size={{ xs: 12, md: 4 }}>
            <UserDropdown
              label="Performed By"
              value={filters.performedBy ?? null}
              options={userOptions}
              loading={userLoading}
              error={userError}
              paginationMeta={userMeta}
              fetchParams={performedByBinding.fetchParams}
              setFetchParams={performedByBinding.setFetchParams}
              onChange={(val) =>
                setValue('performedBy', val ?? undefined, {
                  shouldDirty: true,
                })
              }
              onRefresh={performedByBinding.handleRefresh}
              onOpen={handlePerformedByOpen}
              onInputChange={performedByBinding.handleInputChange}
            />
          </Grid>
          
          {/* --- Reference type (enum) --- */}
          {renderSelectField(
            control,
            'referenceType',
            'Reference Type',
            REFERENCE_TYPE_OPTIONS
          )}
          
          {/* --- Performed at — date range --- */}
          {renderDateField(control, 'performedAtAfter', 'Performed After')}
          {renderDateField(control, 'performedAtBefore', 'Performed Before')}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default WarehouseInventoryActivityLogFilterPanel;
