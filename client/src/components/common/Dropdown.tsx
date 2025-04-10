import { FC } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import { useThemeContext } from '@context/ThemeContext';

interface OptionType {
  value: string | null;
  label: string;
  icon?: typeof faPlus | typeof faSyncAlt; // Allow 'icon' property for specific options
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
}

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
                                     }) => {
  const { theme } = useThemeContext();
  
  // Modified options array with special items at the top
  const modifiedOptions: OptionType[] = [
    { value: 'add', label: 'Add New Customer', icon: faPlus },
    { value: 'refresh', label: 'Refresh List', icon: faSyncAlt },
    ...options
  ];
  
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
          <TextField {...params} label={label} variant="outlined" disabled={disabled} />
        )}
        disableClearable={!searchable}
        fullWidth
        renderOption={(props, option) => (
          <div key={option.value}>
            {/* Divider before the regular options */}
            {(option.value === 'add') && (
              <Divider key={`divider-${option.value}`} sx={{ marginY: 0.5, borderColor: theme.palette.divider }} />
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
                  marginBottom: '4px'
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
                    '&:hover': { textDecoration: 'underline', color: theme.palette.primary.light }
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
                      '&:hover': { textDecoration: 'underline', color: theme.palette.success.light  }
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
                  backgroundColor: option.value === 'add' || option.value === 'refresh'
                    ? theme.palette.backgroundCustom.customDark
                    : 'inherit',
                  color: option.value === 'add'
                    ? theme.palette.actionCustom.addNew
                    : option.value === 'refresh'
                      ? theme.palette.actionCustom.refresh
                      : 'inherit',
                  '&:hover': {
                    backgroundColor: option.value === 'add' || option.value === 'refresh'
                      ? theme.palette.backgroundCustom.customHover
                      : 'inherit',
                    textDecoration: option.value === 'add' || option.value === 'refresh'
                      ? 'underline'
                      : 'none'
                  }
                }}
              >
                {option.icon && (
                  <FontAwesomeIcon icon={option.icon} style={{ marginRight: 8 }} />
                )}
                {option.label}
              </MenuItem>
            )}
          </div>
        )}
      />
    </Box>
  );
};

export default Dropdown;
