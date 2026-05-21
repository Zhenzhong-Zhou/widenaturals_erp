import {
  useMemo,
  type FC,
  type SyntheticEvent,
  type UIEvent,
  type JSX,
  type Key,
  isValidElement,
  type ReactNode,
} from 'react';
import {
  Autocomplete,
  type AutocompleteProps,
  Box,
  Divider,
  Stack,
  Tooltip,
  useTheme
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faPlus, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import {
  BaseInput,
  CustomTypography,
  Loading
} from '@components/index';

export interface OptionType {
  value: string | null;
  label: string | JSX.Element;
  displayLabel?: JSX.Element;
  type?: string; // e.g., 'product' | 'material' | etc.
  icon?: IconProp | JSX.Element;
  iconColor?: string;
  tooltip?: string;
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
    offset: number;
    onFetchMore?: () => void;
  };
  onFetchMore?: (params: { limit: number; offset: number }) => void;
  placeholder?: string;
  helperText?: ReactNode;
  inputValue?: string;
  onOpen?: () => void;
  onInputChange?: (
    event: SyntheticEvent,
    value: string,
    reason: string
  ) => void;
  noOptionsMessage?: string;
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
  placeholder,
  helperText,
  inputValue,
  onOpen,
  onInputChange,
  noOptionsMessage,
}) => {
  const theme = useTheme();

  // Modified options array with special items at the top
  const modifiedOptions = useMemo(() => {
    const baseOptions = [...SPECIAL_OPTIONS];

    if (!loading && !error && options.length === 0) {
      baseOptions.push({
        value: '__no_options__',
        label: noOptionsMessage ?? 'No options available',
        type: 'meta',
      });
    }

    baseOptions.push(...options);

    return hasMore
      ? [
          ...baseOptions,
          { value: '__loading__', label: 'Loading more...', type: 'meta' },
        ]
      : baseOptions;
  }, [options, hasMore, loading, error, noOptionsMessage]);

  return (
    <Box sx={{ minWidth: '200px', width: '100%', ...sx }}>
      <Autocomplete
        disabled={disabled}
        options={modifiedOptions}
        getOptionLabel={(option) =>
          typeof option.label === 'string' ? option.label : ''
        }
        value={modifiedOptions.find((option) => option.value === value) || null}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onOpen={onOpen}
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
            placeholder={placeholder}
            helperText={helperText}
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
                  target.scrollTop + target.clientHeight >=
                  target.scrollHeight - 10;

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
          } as unknown as AutocompleteProps<
            OptionType,
            false,
            boolean,
            false
          >['slotProps']
        }
        loading={loading}
        disableClearable={!searchable}
        fullWidth
        isOptionEqualToValue={(option, val) => option.value === val.value}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props as { key: Key } & typeof props;
          
          // Loading sentinel
          if (option.value === '__loading__') {
            return (
              <Box
                key={key}
                component="li"
                {...optionProps}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  textAlign: 'center',
                  py: 1,
                  width: '100%',
                  backgroundColor: theme.palette.background.paper,
                  cursor: 'default',
                }}
              >
                <Loading size={16} variant="dotted" />
              </Box>
            );
          }
          
          // No-options sentinel
          if (option.value === '__no_options__') {
            return (
              <Box
                key={key}
                component="li"
                {...optionProps}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  textAlign: 'center',
                  py: 1,
                  color: 'text.secondary',
                  cursor: 'default',
                }}
              >
                {typeof option.label === 'string' ? option.label : null}
              </Box>
            );
          }
          
          // "add" slot is just a divider before regular options
          if (option.value === 'add') {
            return (
              <Divider
                key={key}
                component="li"
                sx={{ my: 0.5, borderColor: theme.palette.divider }}
              />
            );
          }
          
          // "refresh" slot renders the header action row
          if (option.value === 'refresh') {
            return (
              <Stack
                key={key}
                component="li"
                {...optionProps}
                direction="row"
                onClick={(e) => e.stopPropagation()}
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 2,
                  py: 1,
                  backgroundColor: theme.palette.background.default,
                  mb: '4px',
                  cursor: 'default',
                  listStyle: 'none',
                }}
              >
                <CustomTypography
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
                
                {onAddNew && (
                  <CustomTypography
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
            );
          }
          
          // Regular option — use a styled <li>, not MenuItem
          return (
            <Box
              key={key}
              component="li"
              {...optionProps}
              data-value={option.value}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'action.hover' },
                '&[aria-selected="true"]': { backgroundColor: 'action.selected' },
              }}
            >
              {option.icon && (
                <Box
                  component="span"
                  sx={{ display: 'flex', alignItems: 'center', mr: 1 }}
                >
                  {option.tooltip ? (
                    <Tooltip title={option.tooltip}>
              <span>
                {isValidElement(option.icon) ? (
                  option.icon
                ) : (
                  <FontAwesomeIcon
                    icon={option.icon as IconProp}
                    color={option.iconColor ?? 'inherit'}
                    style={{ marginRight: 8 }}
                  />
                )}
              </span>
                    </Tooltip>
                  ) : isValidElement(option.icon) ? (
                    option.icon
                  ) : (
                    <FontAwesomeIcon
                      icon={option.icon as IconProp}
                      color={option.iconColor ?? 'inherit'}
                      style={{ marginRight: 8 }}
                    />
                  )}
                </Box>
              )}
              {option.displayLabel
                ? option.displayLabel
                : typeof option.label === 'string'
                  ? <span>{option.label}</span>
                  : option.label}
            </Box>
          );
        }}
      />
    </Box>
  );
};

export default Dropdown;
