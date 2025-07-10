import { type FC } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import type { AddressSortField } from '../state';

interface AddressSortControlsProps {
  sortBy: string;
  sortOrder: '' | 'ASC' | 'DESC';
  onSortByChange: (value: AddressSortField) => void;
  onSortOrderChange: (value: '' | 'ASC' | 'DESC') => void;
}

const sortOptions = [
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  { label: 'City', value: 'city' },
  { label: 'State', value: 'state' },
  { label: 'Postal Code', value: 'postalCode' },
  { label: 'Country', value: 'country' },
  { label: 'Region', value: 'region' },
  { label: 'Label', value: 'label' },
  { label: 'Recipient Name', value: 'recipientName' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'Customer Name', value: 'customerName' },
  { label: 'Customer Email', value: 'customerEmail' },
];

const AddressSortControls: FC<AddressSortControlsProps> = ({
                                                             sortBy,
                                                             sortOrder,
                                                             onSortByChange,
                                                             onSortOrderChange,
                                                           }) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ minHeight: 56 }}>
      <FormControl size="small" sx={{ minWidth: 160, minHeight: 56 }}>
        <InputLabel id="sort-by-label">Sort By</InputLabel>
        <Select
          labelId="sort-by-label"
          name="sortBy"
          label="Sort By"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as AddressSortField)}
        >
          <MenuItem value="">Default</MenuItem>
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl size="small" sx={{ minWidth: 140, minHeight: 56 }}>
        <InputLabel id="sort-order-label">Order</InputLabel>
        <Select
          labelId="sort-order-label"
          name="sortOrder"
          label="Order"
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value as '' | 'ASC' | 'DESC')}
        >
          <MenuItem value="">Default</MenuItem>
          <MenuItem value="ASC">Ascending</MenuItem>
          <MenuItem value="DESC">Descending</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
};

export default AddressSortControls;
