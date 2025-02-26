import { FC } from "react";
import Box from "@mui/material/Box";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { formatDate } from "@utils/dateTimeUtils.ts";

interface DatePickerProps {
  label?: string;
  value: string | Date | null;
  onChange: (value: string) => void;
  format?: string; // Allows custom format like "yyyy-MM-dd"
  minDate?: Date; // Optional min date
  maxDate?: Date; // Optional max date
  views?: ("year" | "month" | "day")[];
  openTo?: "year" | "month" | "day";
  defaultValue?: Date;
  sx?: object;
  inputSx?: object;
}

const CustomDatePicker: FC<DatePickerProps> = ({
                                                 label = "Select Date",
                                                 value,
                                                 onChange,
                                                 format: dateFormat = "yyyy-MM-dd",
                                                 minDate,
                                                 maxDate,
                                                 views = ["year", "month", "day"], // Default views if not provided
                                                 openTo = "day", // Default open view
                                                 defaultValue,
                                                 sx,
                                                 inputSx,
                                               }) => {
  const parsedValue = value ? new Date(value) : null;
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minWidth: 200, flexGrow: 1, ...sx }}>
        <DatePicker
          label={label}
          value={parsedValue}
          onChange={(date: Date | null) => {
            onChange(date ? formatDate(date) : "");
          }}
          minDate={minDate}
          maxDate={maxDate}
          format={dateFormat}
          views={views}
          openTo={openTo}
          defaultValue={defaultValue}
          slotProps={{
            textField: {
              fullWidth: false,
              sx: { width: "200px", ...inputSx },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CustomDatePicker;
