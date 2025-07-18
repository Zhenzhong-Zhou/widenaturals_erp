import { type FC, useMemo, type UIEvent } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import BaseInput from '@components/common/BaseInput';
import type { LookupPaginationMeta } from '@features/lookup/state';

export interface MultiSelectOption {
  value: string;
  label: string;
  [key: string]: any;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  selectedOptions: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string | null;
  helperText?: string;
  paginationMeta?: LookupPaginationMeta
  sx?: object;
}

const MultiSelectDropdown: FC<MultiSelectDropdownProps> = ({
                                                             label,
                                                             options,
                                                             selectedOptions,
                                                             onChange,
                                                             loading = false,
                                                             disabled = false,
                                                             placeholder,
                                                             error,
                                                             helperText,
                                                             paginationMeta,
                                                             sx = {},
                                                           }) => {
  const { hasMore, onFetchMore } = paginationMeta ?? {};
  
  const modifiedOptions = useMemo(() => {
    return hasMore
      ? [
        ...options,
        {
          value: '__loading__',
          label: 'Loading more...',
          type: 'meta',
        },
      ]
      : options;
  }, [options, hasMore]);
  
  return (
    <Box sx={{ width: '100%', minWidth: 250, ...sx }}>
      <Autocomplete
        multiple
        options={modifiedOptions}
        getOptionLabel={(option) => option.label}
        value={selectedOptions}
        isOptionEqualToValue={(opt, val) => opt.value === val.value}
        onChange={(_, newValue) => {
          // Ignore special meta option
          const filtered = newValue.filter((opt) => opt.value !== '__loading__');
          onChange(filtered);
        }}
        loading={loading}
        renderInput={(params) => (
          <BaseInput
            {...params}
            label={label}
            placeholder={placeholder}
            variant="outlined"
            disabled={disabled}
            error={!!error}
            helperText={error || helperText}
          />
        )}
        renderValue={(selected, getTagProps) =>
          selected.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.value}
              label={option.label}
            />
          ))
        }
        slotProps={{
          listbox: {
            onScroll: (event: UIEvent<HTMLUListElement>) => {
              const target = event.currentTarget;
              const bottom =
                target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
              
              if (bottom && hasMore && onFetchMore) {
                onFetchMore();
              }
            },
            style: { maxHeight: 300, overflowY: 'auto' },
          },
        }}
        renderOption={(props, option) => {
          if (option.value === '__loading__') {
            return (
              <li {...props} key="loading-option">
                <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>
                  <CircularProgress size={18} />
                </Box>
              </li>
            );
          }
          return (
            <li {...props} key={option.value}>
              {option.label}
            </li>
          );
        }}
      />
    </Box>
  );
};

export default MultiSelectDropdown;
