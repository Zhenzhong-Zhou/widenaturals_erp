import type { FC } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface BooleanSelectProps {
  label: string;
  value: boolean | undefined | null | '';
  onChange: (value: boolean | undefined) => void;
  allowAll?: boolean;
  fullWidth?: boolean;
}

const BooleanSelect: FC<BooleanSelectProps> = ({
                                                 label,
                                                 value,
                                                 onChange,
                                                 allowAll = true,
                                                 fullWidth = true,
                                               }) => {
  const handleChange = (e: SelectChangeEvent) => {
    const val = e.target.value;
    if (val === 'true') onChange(true);
    else if (val === 'false') onChange(false);
    else onChange(undefined);
  };
  
  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value === undefined || value === null ? '' : String(value)}
        label={label}
        onChange={handleChange}
      >
        {allowAll && <MenuItem value="">All</MenuItem>}
        <MenuItem value="true">Yes</MenuItem>
        <MenuItem value="false">No</MenuItem>
      </Select>
    </FormControl>
  );
};

export default BooleanSelect;
