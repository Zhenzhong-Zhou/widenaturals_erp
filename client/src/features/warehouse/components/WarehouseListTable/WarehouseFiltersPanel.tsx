import { type FC } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import { renderInputField, renderSelectField } from '@utils/filters/filterUtils';
import type { WarehouseFilters } from '@features/warehouse';
import { useFilterFormSync } from '@utils/filters/useFilterFormSync';

// =========================================================
// Types
// =========================================================

interface Props {
  filters: WarehouseFilters;
  onChange: (filters: WarehouseFilters) => void;
  onFilterChange?: (filters: WarehouseFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

// =========================================================
// Defaults
// =========================================================

const emptyFilters: WarehouseFilters = {
  statusId:        undefined,
  isArchived:      undefined,
  warehouseTypeId: undefined,
  locationId:      undefined,
  name:            '',
  code:            '',
  keyword:         '',
  createdBy:       undefined,
  updatedBy:       undefined,
  createdAfter:    undefined,
  createdBefore:   undefined,
  updatedAfter:    undefined,
  updatedBefore:   undefined,
};

// =========================================================
// Component
// =========================================================

/**
 * Filter panel for the warehouse list page.
 *
 * Provides filtering by:
 * - name, code, keyword (text search)
 * - isArchived (boolean flag)
 * - statusId, warehouseTypeId, locationId (UUID fields)
 * - createdBy, updatedBy, date ranges (audit fields)
 */
const WarehouseFiltersPanel: FC<Props> = ({
                                            filters,
                                            onChange,
                                            onFilterChange,
                                            onApply,
                                            onReset,
                                          }) => {
  const { control, handleSubmit, reset, watch } =
    useForm<WarehouseFilters>({ defaultValues: filters });
  
  const watchedValues = watch();
  
  useFilterFormSync(watchedValues, filters, reset, onFilterChange);
  
  // -------------------------
  // Submit / Reset
  // -------------------------
  const submitFilters = (data: WarehouseFilters) => {
    onChange({
      ...data,
      name:       data.name       || undefined,
      code:       data.code       || undefined,
      keyword:    data.keyword    || undefined,
      isArchived: data.isArchived != null
        ? String(data.isArchived) === 'true'
        : undefined,
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
          {renderInputField(control, 'keyword',  'Search',  'Name or code…')}
          {renderInputField(control, 'name',     'Name')}
          {renderInputField(control, 'code',     'Code')}
          {renderSelectField(control, 'isArchived', 'Archived', [
            { label: 'Archived',     value: 'true'  },
            { label: 'Not Archived', value: 'false' },
          ])}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default WarehouseFiltersPanel;
