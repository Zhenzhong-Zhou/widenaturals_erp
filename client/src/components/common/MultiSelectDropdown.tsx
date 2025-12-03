import { type FC, useMemo, useEffect, useState, type UIEvent } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import BaseInput from '@components/common/BaseInput';
import Loading from '@components/common/Loading';
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
  onOpen?: () => void;
  
  // states
  loading?: boolean;
  disabled?: boolean;

  // ux
  placeholder?: string;
  error?: string | null;
  helperText?: string;
  sx?: object;

  // infinite scroll
  paginationMeta?: LookupPaginationMeta & {
    // keep your original shape but allow optional limit/offset when helpful
    limit?: number;
    offset?: number;
    onFetchMore?: (next?: { limit?: number; offset?: number }) => void;
  };

  // server-side search (optional)
  inputValue?: string;
  onInputChange?: (value: string) => void;

  // optional flags
  disableClientFilter?: boolean; // set true when doing server-side filtering
}

const LOADING_OPTION = {
  value: '__loading__',
  label: 'Loading more...',
  type: 'meta',
} as const;

const MultiSelectDropdown: FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selectedOptions,
  onChange,
  onOpen,
  loading = false,
  disabled = false,
  placeholder,
  error,
  helperText,
  paginationMeta,
  sx = {},
  inputValue,
  onInputChange,
  disableClientFilter = true,
}) => {
  const { hasMore = false, onFetchMore, limit, offset } = paginationMeta ?? {};
  const [fetchLocked, setFetchLocked] = useState(false);

  // unlock the fetch lock when loading finishes
  useEffect(() => {
    if (!loading) setFetchLocked(false);
  }, [loading]);

  // append sentinel loading row when there is more to fetch
  const modifiedOptions = useMemo(() => {
    return hasMore ? [...options, LOADING_OPTION] : options;
  }, [options, hasMore]);

  const handleListboxScroll = (event: UIEvent<HTMLUListElement>) => {
    if (!hasMore || !onFetchMore || fetchLocked) return;

    const target = event.currentTarget;
    const reachedBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 10;

    if (reachedBottom) {
      setFetchLocked(true); // prevent burst calls
      onFetchMore({ limit, offset: (offset ?? 0) + (limit ?? 0) });
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 250, ...sx }}>
      <Autocomplete
        multiple
        options={modifiedOptions}
        // when doing server-side search, disable MUI’s client filter so meta items survive
        filterOptions={disableClientFilter ? (x) => x : undefined}
        getOptionLabel={(option) => option.label ?? ''}
        value={selectedOptions}
        isOptionEqualToValue={(opt, val) => opt.value === val.value}
        onChange={(_, newValue) => {
          // strip the meta row if it ever gets in
          const filtered = newValue.filter(
            (opt) => opt.value !== LOADING_OPTION.value
          );
          onChange(filtered);
        }}
        onOpen={() => {
          if (onOpen) onOpen();
        }}
        inputValue={inputValue}
        onInputChange={(_, val) => onInputChange?.(val)}
        loading={loading}
        disabled={disabled}
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
          popper: {
            modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
          },
          listbox: {
            onScroll: handleListboxScroll,
            style: {
              maxHeight: 300,
              overflowY: 'auto',
              paddingBottom: hasMore ? 40 : 0,
            },
          },
        }}
        renderOption={(props, option) => {
          if (option.value === LOADING_OPTION.value) {
            return (
              <li {...props} key="loading-option">
                <Box sx={{ width: '100%', textAlign: 'center', py: 1 }}>
                  <Loading size={18} variant="dotted" />
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
