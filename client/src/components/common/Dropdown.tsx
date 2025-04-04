import { FC } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

interface DropdownProps {
  label: string;
  options: { value: string | null; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  searchable?: boolean;
  disabled?: boolean;
  sx?: object;
}

const Dropdown: FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  searchable = false,
  disabled = false,
  sx,
}) => {
  return (
    <Box sx={{ minWidth: '200px', width: '100%', ...sx }}>
      <Autocomplete
        options={options}
        getOptionLabel={(option) => option.label}
        value={options.find((option) => option.value === value) || null}
        onChange={(_, newValue) => onChange(newValue?.value || '')}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="outlined"
            disabled={disabled}
          />
        )}
        disableClearable={!searchable}
        filterSelectedOptions
      />
    </Box>
  );
};

export default Dropdown;
