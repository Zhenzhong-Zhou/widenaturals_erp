import { useMemo, type FC, type UIEvent } from 'react';
import Autocomplete, { type AutocompleteProps } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import CustomTypography from '@components/common/CustomTypography';
import BaseInput from '@components/common/BaseInput';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import { useThemeContext } from '@context/ThemeContext';

interface OptionType {
  value: string | null;
  label: string;
  icon?: typeof faSyncAlt;
  type?: string; // e.g., 'product' | 'material' | etc.
  [key: string]: any;
}

interface DropdownProps {
  label: string;
  options?: OptionType[];
  value: string | null;
  onChange: (value: string) => void;
  searchable?: boolean;
  disabled?: boolean;
  sx?: object;
  onRefresh?: () => void;
  onAddNew?: () => void;
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  pagination?: {
    limit: number;
    offset: number;onFetchMore?: () => void;
  };
  onFetchMore?: (params: { limit: number; offset: number }) => void;
}

const SPECIAL_OPTIONS: OptionType[] = [
  { value: 'add', label: 'Add New Customer', icon: faPlus },
  { value: 'refresh', label: 'Refresh List', icon: faSyncAlt },
];

const Dropdown: FC<DropdownProps> = ({
                                       label,
                                       options = [],
                                       value,
                                       onChange,
                                       searchable = false,
                                       disabled = false,
                                       sx,
                                       onRefresh,
                                       onAddNew = null,
                                       loading = false,
                                       error,
                                       hasMore = false,
                                       pagination,
                                       onFetchMore,
                                     }) => {
  const { theme } = useThemeContext();

  // Modified options array with special items at the top
  const modifiedOptions = useMemo(() => {
    const baseOptions = [...SPECIAL_OPTIONS, ...options];
    return hasMore
      ? [...baseOptions, { value: '__loading__', label: 'Loading more...', type: 'meta' }]
      : baseOptions;
  }, [options, hasMore]);
  
  return (
    <Box sx={{ minWidth: '200px', width: '100%', ...sx }}>
      <Autocomplete
        options={modifiedOptions}
        getOptionLabel={(option) => option.label || ''}
        value={modifiedOptions.find((option) => option.value === value) || null}
        onChange={(_, newValue) => {
          if (newValue?.value === 'add' && onAddNew) onAddNew();
          else if (newValue?.value === 'refresh' && onRefresh) onRefresh();
          else onChange(newValue?.value || '');
        }}
        renderInput={(params) => (
          <BaseInput
            {...params}
            label={label}
            variant="outlined"
            disabled={disabled}
            error={!!error}
          />
        )}
        slotProps={
          {
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 8],
                  },
                },
              ],
            },
            input: {
              endAdornment: (
                <>
                  {loading && (
                    <Box sx={{ mr: 1 }}>
                      <Loading size={18} variant="dotted" />
                    </Box>
                  )}
                </>
              ),
            },
            listbox: {
              onScroll: (event: UIEvent<HTMLUListElement>) => {
                const target = event.currentTarget;
                const reachedBottom =
                  target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
                
                if (reachedBottom && hasMore && pagination) {
                  const { limit, offset } = pagination;
                  onFetchMore?.({ limit, offset: offset + limit });
                }
              },
              style: {
                maxHeight: 300,
                overflowY: 'auto',
                paddingBottom: hasMore ? 40 : 0,
              },
            },
          } as unknown as AutocompleteProps<OptionType, false, boolean, false>['slotProps']
        }
        loading={loading}
        disableClearable={!searchable}
        fullWidth
        isOptionEqualToValue={(option, val) => option.value === val.value}
        renderOption={(props, option) => (
          <Box key={option.value}>
            {option.value === '__loading__' && (
              <Box
                key="loading-indicator"
                sx={{
                  textAlign: 'center',
                  py: 1,
                  width: '100%',
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Loading size={16} variant="dotted" />
              </Box>
            )}
            
            {/* Divider before the regular options */}
            {option.value === 'add' && (
              <Divider
                key={`divider-${option.value}`}
                sx={{ marginY: 0.5, borderColor: theme.palette.divider }}
              />
            )}
            
            {option.value === 'refresh' && (
              <Stack
                key="top-options"
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  padding: '8px 16px',
                  backgroundColor: theme.palette.background.default,
                  marginBottom: '4px',
                }}
              >
                {/* Refresh List Button */}
                <CustomTypography
                  key="refresh-button"
                  onClick={onRefresh}
                  sx={{
                    cursor: 'pointer',
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: theme.palette.primary.light,
                    },
                  }}
                >
                  <FontAwesomeIcon icon={faSyncAlt} />
                  Refresh
                </CustomTypography>

                {/* Add New Button */}
                {onAddNew && (
                  <CustomTypography
                    key="add-new-button"
                    onClick={onAddNew}
                    sx={{
                      cursor: 'pointer',
                      color: theme.palette.success.main,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: theme.palette.success.light,
                      },
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add New
                  </CustomTypography>
                )}
              </Stack>
            )}

            {/* Render Regular Options */}
            {option.value !== 'refresh' && option.value !== 'add' && (
              <MenuItem
                {...props}
                key={`option-${option.value}`}
                data-value={option.value}
                sx={{
                  backgroundColor:
                    option.value === 'add' || option.value === 'refresh'
                      ? theme.palette.backgroundCustom.customDark
                      : 'inherit',
                  color:
                    option.value === 'add'
                      ? theme.palette.actionCustom.addNew
                      : option.value === 'refresh'
                        ? theme.palette.actionCustom.refresh
                        : 'inherit',
                  '&:hover': {
                    backgroundColor:
                      option.value === 'add' || option.value === 'refresh'
                        ? theme.palette.backgroundCustom.customHover
                        : 'inherit',
                    textDecoration:
                      option.value === 'add' || option.value === 'refresh'
                        ? 'underline'
                        : 'none',
                  },
                }}
              >
                {option.icon && (
                  <FontAwesomeIcon
                    icon={option.icon}
                    style={{ marginRight: 8 }}
                  />
                )}
                {option.label}
              </MenuItem>
            )}
            {error && (
              <Box mt={1}>
                <ErrorMessage message={error} />
              </Box>
            )}
          </Box>
        )}
      />
    </Box>
  );
};

export default Dropdown;
