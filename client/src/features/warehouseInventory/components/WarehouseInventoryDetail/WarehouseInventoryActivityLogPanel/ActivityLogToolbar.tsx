import { type FC, type MouseEvent, useMemo, useState } from 'react';
import { Box, Chip, IconButton, Popover, Stack } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { CustomButton, CustomTypography } from '@components/index';
import type { InventoryActivityLogFilters } from '@features/warehouseInventory/state';
import { formatDate } from '@utils/dateTimeUtils';
import { ActivityLogFiltersForm } from '@features/warehouseInventory/components/WarehouseInventoryDetail/WarehouseInventoryActivityLogPanel/index';

type ActivityLogToolbarProps = {
  filters: InventoryActivityLogFilters;
  onFiltersChange: (next: InventoryActivityLogFilters) => void;
  onReset: () => void;
  /** Optional resolvers for chip labels. If absent, chips show raw UUIDs. */
  resolveActionTypeName?: (id: string) => string | undefined;
  resolveAdjustmentTypeName?: (id: string) => string | undefined;
  resolveUserName?: (id: string) => string | undefined;
};

const ActivityLogToolbar: FC<ActivityLogToolbarProps> = ({
  filters,
  onFiltersChange,
  onReset,
  resolveActionTypeName,
  resolveAdjustmentTypeName,
  resolveUserName,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const activeChips = useMemo(() => {
    const chips: { key: keyof InventoryActivityLogFilters; label: string }[] =
      [];

    if (filters.actionTypeId) {
      chips.push({
        key: 'actionTypeId',
        label: `Action: ${resolveActionTypeName?.(filters.actionTypeId) ?? filters.actionTypeId}`,
      });
    }
    if (filters.adjustmentTypeId) {
      chips.push({
        key: 'adjustmentTypeId',
        label: `Adjustment: ${resolveAdjustmentTypeName?.(filters.adjustmentTypeId) ?? filters.adjustmentTypeId}`,
      });
    }
    if (filters.referenceType) {
      chips.push({
        key: 'referenceType',
        label: `Reference: ${filters.referenceType}`,
      });
    }
    if (filters.performedBy) {
      chips.push({
        key: 'performedBy',
        label: `By: ${resolveUserName?.(filters.performedBy) ?? filters.performedBy}`,
      });
    }
    if (filters.performedAtAfter) {
      chips.push({
        key: 'performedAtAfter',
        label: `From: ${formatDate(filters.performedAtAfter)}`,
      });
    }
    if (filters.performedAtBefore) {
      chips.push({
        key: 'performedAtBefore',
        label: `To: ${formatDate(filters.performedAtBefore)}`,
      });
    }

    return chips;
  }, [
    filters,
    resolveActionTypeName,
    resolveAdjustmentTypeName,
    resolveUserName,
  ]);

  const handleRemoveFilter = (key: keyof InventoryActivityLogFilters) => {
    const next = { ...filters };
    delete next[key];
    onFiltersChange(next);
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <IconButton
          size="small"
          onClick={handleOpen}
          aria-label="Filter activity log"
        >
          <FilterListIcon fontSize="small" />
        </IconButton>

        {activeChips.length === 0 ? (
          <CustomTypography variant="body2" color="text.secondary">
            No filters applied
          </CustomTypography>
        ) : (
          activeChips.map((chip) => (
            <Chip
              key={chip.key}
              size="small"
              label={chip.label}
              onDelete={() => handleRemoveFilter(chip.key)}
            />
          ))
        )}

        {activeChips.length > 0 && (
          <CustomButton size="small" variant="text" onClick={onReset}>
            Clear all
          </CustomButton>
        )}
      </Stack>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 2, width: 360 } } }}
      >
        <ActivityLogFiltersForm
          filters={filters}
          onFiltersChange={onFiltersChange}
          onReset={() => {
            onReset();
            handleClose();
          }}
          onClose={handleClose}
        />
      </Popover>
    </Box>
  );
};

export default ActivityLogToolbar;
