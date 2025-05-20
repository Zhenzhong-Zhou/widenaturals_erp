import type { FC } from 'react';
import Box from '@mui/material/Box';
import {
  LocalizationProvider,
  DatePicker,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface CustomDatePickerProps {
  label?: string;
  value: Date | string | null;
  onChange: (value: Date | null) => void;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  views?: ('year' | 'month' | 'day')[];
  openTo?: 'year' | 'month' | 'day';
  disabled?: boolean;
  defaultValue?: Date;
  sx?: object;
  inputSx?: object;
}

const CustomDatePicker: FC<CustomDatePickerProps> = ({
                                                       label = 'Select Date',
                                                       value,
                                                       onChange,
                                                       format: dateFormat = 'yyyy-MM-dd',
                                                       minDate,
                                                       maxDate,
                                                       views = ['year', 'month', 'day'],
                                                       openTo = 'day',
                                                       disabled = false,
                                                       defaultValue,
                                                       sx,
                                                       inputSx,
                                                     }) => {
  const parsedValue = value instanceof Date ? value : value ? new Date(value) : null;
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minWidth: 200, flexGrow: 1, ...sx }}>
        <DatePicker
          label={label}
          value={parsedValue}
          onChange={onChange}
          format={dateFormat}
          views={views}
          openTo={openTo}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          defaultValue={defaultValue}
          slotProps={{
            textField: {
              fullWidth: true,
              variant: 'outlined',
              sx: { width: '100%', ...inputSx },
              error: false,
              helperText: '', // Optional: avoids layout shift if form libraries used
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CustomDatePicker;
