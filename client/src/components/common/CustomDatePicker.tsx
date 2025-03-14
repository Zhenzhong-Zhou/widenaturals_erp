import { FC } from 'react';
import Box from '@mui/material/Box';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

interface DatePickerProps {
  label?: string;
  value: string | Date | null;
  onChange: (value: Date | null) => void;
  format?: string; // Allows custom format like "yyyy-MM-dd"
  minDate?: Date; // Optional min date
  maxDate?: Date; // Optional max date
  views?: ('year' | 'month' | 'day')[];
  openTo?: 'year' | 'month' | 'day';
  disabled?: boolean; // Disable DatePicker if needed
  defaultValue?: Date;
  sx?: object;
  inputSx?: object;
}

const CustomDatePicker: FC<DatePickerProps> = ({
  label = 'Select Date',
  value,
  onChange,
  format: dateFormat = 'yyyy-MM-dd',
  minDate,
  maxDate,
  views = ['year', 'month', 'day'],
  openTo = 'day',
  defaultValue,
  disabled = false, // Default: not disabled
  sx,
  inputSx,
}) => {
  // Ensure the value is a valid Date object
  const parsedValue = value ? new Date(value) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minWidth: 200, flexGrow: 1, ...sx }}>
        <DatePicker
          label={label}
          value={parsedValue}
          onChange={(date: Date | null) => onChange(date)}
          minDate={minDate}
          maxDate={maxDate}
          format={dateFormat}
          views={views}
          openTo={openTo}
          disabled={disabled}
          defaultValue={defaultValue}
          slotProps={{
            textField: {
              fullWidth: false,
              sx: { width: '200px', ...inputSx },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CustomDatePicker;
