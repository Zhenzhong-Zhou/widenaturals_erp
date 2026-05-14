import { type FC, useState } from 'react';
import { Box, MenuItem, Stack, TextField } from '@mui/material';
import { CustomButton, CustomTypography } from '@components/index';
import type { InventoryActivityLogFilters } from '@features/warehouseInventory/state';

type ActivityLogFiltersFormProps = {
  filters: InventoryActivityLogFilters;
  onFiltersChange: (next: InventoryActivityLogFilters) => void;
  onReset: () => void;
  onClose: () => void;
};

const REFERENCE_TYPE_OPTIONS: Array<
  NonNullable<InventoryActivityLogFilters['referenceType']>
> = ['order', 'transfer', 'audit', 'return', 'manual'];

const ActivityLogFiltersForm: FC<ActivityLogFiltersFormProps> = ({
  filters,
  onFiltersChange,
  onReset,
  onClose,
}) => {
  // Draft state — don't fire fetches on every keystroke; commit on Apply
  const [draft, setDraft] = useState<InventoryActivityLogFilters>(filters);

  const handleChange = <K extends keyof InventoryActivityLogFilters>(
    key: K,
    value: InventoryActivityLogFilters[K] | undefined
  ) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (value === undefined || value === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const handleApply = () => {
    onFiltersChange(draft);
    onClose();
  };

  return (
    <Stack spacing={2}>
      <CustomTypography variant="subtitle1" fontWeight={600}>
        Filter Activity Log
      </CustomTypography>

      {/* Swap for an action type LookupSelect when available */}
      <TextField
        label="Action type ID"
        size="small"
        fullWidth
        value={draft.actionTypeId ?? ''}
        onChange={(e) =>
          handleChange('actionTypeId', e.target.value || undefined)
        }
      />

      {/* Swap for an adjustment type LookupSelect when available */}
      <TextField
        label="Adjustment type ID"
        size="small"
        fullWidth
        value={draft.adjustmentTypeId ?? ''}
        onChange={(e) =>
          handleChange('adjustmentTypeId', e.target.value || undefined)
        }
      />

      <TextField
        select
        label="Reference type"
        size="small"
        fullWidth
        value={draft.referenceType ?? ''}
        onChange={(e) =>
          handleChange(
            'referenceType',
            (e.target.value ||
              undefined) as InventoryActivityLogFilters['referenceType']
          )
        }
      >
        <MenuItem value="">Any</MenuItem>
        {REFERENCE_TYPE_OPTIONS.map((ref) => (
          <MenuItem key={ref} value={ref}>
            {ref}
          </MenuItem>
        ))}
      </TextField>

      {/* Swap for a user LookupSelect when available */}
      <TextField
        label="Performed by (user ID)"
        size="small"
        fullWidth
        value={draft.performedBy ?? ''}
        onChange={(e) =>
          handleChange('performedBy', e.target.value || undefined)
        }
      />

      <Stack direction="row" spacing={1}>
        <TextField
          label="From"
          type="date"
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          value={draft.performedAtAfter?.split('T')[0] ?? ''}
          onChange={(e) =>
            handleChange(
              'performedAtAfter',
              e.target.value
                ? new Date(e.target.value).toISOString()
                : undefined
            )
          }
        />
        <TextField
          label="To"
          type="date"
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          value={draft.performedAtBefore?.split('T')[0] ?? ''}
          onChange={(e) =>
            handleChange(
              'performedAtBefore',
              e.target.value
                ? new Date(e.target.value).toISOString()
                : undefined
            )
          }
        />
      </Stack>

      <Box display="flex" justifyContent="flex-end" gap={1}>
        <CustomButton variant="text" onClick={onReset}>
          Reset
        </CustomButton>
        <CustomButton variant="contained" onClick={handleApply}>
          Apply
        </CustomButton>
      </Box>
    </Stack>
  );
};

export default ActivityLogFiltersForm;
