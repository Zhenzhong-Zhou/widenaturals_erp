import React, { useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { BaseInput } from '@components/index';
import CustomButton from '@components/common/CustomButton.tsx';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';

export interface SkuProductCardFilters {
  brand?: string;
  category?: string;
  marketRegion?: string;
  sizeLabel?: string;
  keyword?: string;
}

interface SkuProductCardFilterPanelProps {
  filters: SkuProductCardFilters;
  onChange: (updatedFilters: SkuProductCardFilters) => void;
  showReset?: boolean;
}

const BRANDS = ['Canaherb', 'Phyto-Genious', 'Wide Naturals'] as const;
const CATEGORIES = ['Herbal Natural', 'NMN', 'TCM', 'Marine Oil'] as const;
const MARKET_REGIONS = ['Canada', 'China', 'Universe'] as const;
const SIZE_LABELS = [
  '50g',
  '60 Capsules',
  '30 Softgels',
  '60 Softgels',
  '120 Softgels',
  '180 Softgels',
] as const;
const KEYWORD_SUGGESTIONS = [
  'NMN',
  'Canaherb',
  'Seal Oil',
  'Focus',
  'TCM',
  'Marine Oil',
];

const SkuProductCardFilterPanel: React.FC<SkuProductCardFilterPanelProps> = ({
                                                                               filters,
                                                                               onChange,
                                                                               showReset = true,
                                                                             }) => {
  const [localKeyword, setLocalKeyword] = useState(filters.keyword ?? '');
  
  const handleChange =
    (key: keyof SkuProductCardFilters) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value || undefined;
        onChange({ ...filters, [key]: value });
      };
  
  const handleReset = () => {
    setLocalKeyword('');
    onChange({});
  };
  
  const handleSearch = () => {
    onChange({ ...filters, keyword: localKeyword.trim() || undefined });
  };
  
  const handleKeywordKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems="center"
      flexWrap="wrap"
      sx={{ mb: 3 }}
    >
      {[
        { label: 'Brand', value: filters.brand ?? '', options: BRANDS, key: 'brand' },
        { label: 'Category', value: filters.category ?? '', options: CATEGORIES, key: 'category' },
        { label: 'Market', value: filters.marketRegion ?? '', options: MARKET_REGIONS, key: 'marketRegion' },
        { label: 'Size', value: filters.sizeLabel ?? '', options: SIZE_LABELS, key: 'sizeLabel' },
      ].map(({ label, value, options, key }) => {
        const inputId = `filter-${key}`;
        
        return (
          <BaseInput
            key={label}
            name={key}
            select
            value={value}
            label={label}
            slotProps={{
              input: { id: inputId },
              inputLabel: { htmlFor: inputId },
            }}
            onChange={handleChange(key as keyof SkuProductCardFilters)}
            size="small"
            sx={{
              minWidth: 120,
              borderRadius: 10,
              '& .MuiInputBase-root': {
                borderRadius: '24px',
              },
            }}
          >
            {options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </BaseInput>
        );
      })}
      
      {/* Keyword search with search icon */}
      <Autocomplete
        freeSolo
        options={KEYWORD_SUGGESTIONS}
        value={localKeyword}
        inputValue={localKeyword}
        onInputChange={(_, newValue) => setLocalKeyword(newValue)}
        size="small"
        sx={{
          width: 200,
          '& .MuiInputBase-root': {
            borderRadius: '24px',
            height: '40px',
            pr: '36px', // spacing for search icon
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Keyword"
            placeholder="Search..."
            onKeyDown={handleKeywordKeyDown}
            sx={{
              '& .MuiInputBase-root': {
                height: '40px',
                borderRadius: '24px',
              },
            }}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <>
                    <IconButton
                      size="small"
                      onClick={handleSearch}
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </>
                ),
              },
            }}
          />
        )}
      />
      
      {/* Reset Button */}
      {showReset && (
        <CustomButton
          variant="outlined"
          size="small"
          onClick={handleReset}
          sx={{
            borderRadius: '24px',
            px: 3,
            color: 'success.main',
            borderColor: 'success.main',
            '&:hover': {
              backgroundColor: 'success.main',
              color: '#000',
            },
          }}
        >
          Reset
        </CustomButton>
      )}
    </Stack>
  );
};

export default SkuProductCardFilterPanel;
