import { type FC } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import type { CustomerSortField } from '../state';

interface CustomerSortControlsProps {
  sortBy: string;
  sortOrder: '' | 'ASC' | 'DESC';
  onSortByChange: (value: CustomerSortField) => void;
  onSortOrderChange: (value: '' | 'ASC' | 'DESC') => void;
}

const sortOptions = [
  { label: 'Customer Name', value: 'customerName' },
  { label: 'Email', value: 'email' },
  { label: 'Phone Number', value: 'phoneNumber' },
  { label: 'Region', value: 'region' },
  { label: 'Country', value: 'country' },
  { label: 'Status', value: 'status' },
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  { label: 'Created By', value: 'createdBy' },
  { label: 'Updated By', value: 'updatedBy' },
];

const CustomerSortControls: FC<CustomerSortControlsProps> = ({
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
          onChange={(e) => onSortByChange(e.target.value as CustomerSortField)}
        >
          <MenuItem value="">Default</MenuItem>
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl size="small" sx={{ minWidth: 140 }}>
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

export default CustomerSortControls;
