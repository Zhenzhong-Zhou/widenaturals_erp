import type { FC } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export interface BooleanSelectOption {
  value: string;
  label: string;
}

interface BooleanSelectProps {
  label: string;
  value: boolean | undefined | null | '';
  onChange: (value: boolean | undefined) => void;
  allowAll?: boolean;
  fullWidth?: boolean;
  options?: BooleanSelectOption[];
}

const BooleanSelect: FC<BooleanSelectProps> = ({
  label,
  value,
  onChange,
  allowAll = true,
  fullWidth = true,
  options,
}) => {
  const handleChange = (e: SelectChangeEvent) => {
    const val = e.target.value;
    if (val === 'true') onChange(true);
    else if (val === 'false') onChange(false);
    else onChange(undefined);
  };

  const defaultOptions: BooleanSelectOption[] = [];

  if (allowAll) {
    defaultOptions.push({ value: '', label: 'All' });
  }

  defaultOptions.push(
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' }
  );

  const renderedOptions = options ?? defaultOptions;

  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value === undefined || value === null ? '' : String(value)}
        label={label}
        onChange={handleChange}
      >
        {renderedOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default BooleanSelect;
