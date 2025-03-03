import { FC } from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';

interface DropdownProps {
  label: string;
  options: { value: string | null; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  searchable?: boolean;
  sx?: object;
}

const Dropdown: FC<DropdownProps> = ({ label, options, value, onChange, searchable = false, sx }) => {
  return (
    <Box sx={{ minWidth: '200px', width: '100%', ...sx }}>
      <Autocomplete
        options={options}
        getOptionLabel={(option) => option.label}
        value={options.find((option) => option.value === value) || null}
        onChange={(_, newValue) => onChange(newValue?.value || '')}
        renderInput={(params) => <TextField {...params} label={label} variant="outlined" />}
        disableClearable={!searchable}
        filterSelectedOptions
      />
    </Box>
  );
};

export default Dropdown;
