import type { FC } from 'react';
import type { SortOrder } from '@shared-types/api';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';

interface SortControlsProps {
  sortBy: string;
  sortOrder: SortOrder;
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: SortOrder) => void;
  sortOptions: { label: string; value: string }[];
}

const SortControls: FC<SortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  sortOptions,
}) => {
  const sortById = 'sort-by';
  const sortOrderId = 'sort-order';

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ minHeight: 40, alignItems: 'center' }}
    >
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id={`${sortById}-label`} htmlFor={`${sortById}-select`}>
          Sort By
        </InputLabel>
        <Select
          inputProps={{ id: `${sortById}-select` }}
          labelId={`${sortById}-label`}
          name="sortBy"
          label="Sort By"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
        >
          <MenuItem value="">Select Sort Field</MenuItem>
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel
          id={`${sortOrderId}-label`}
          htmlFor={`${sortOrderId}-select`}
        >
          Order
        </InputLabel>
        <Select
          inputProps={{ id: `${sortOrderId}-select` }}
          labelId={`${sortOrderId}-label`}
          name="sortOrder"
          label="Order"
          value={sortOrder}
          onChange={(e) =>
            onSortOrderChange(e.target.value as '' | 'ASC' | 'DESC')
          }
        >
          <MenuItem value="">Select Order</MenuItem>
          <MenuItem value="ASC">Ascending</MenuItem>
          <MenuItem value="DESC">Descending</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
};

export default SortControls;
