import type { ChangeEvent, FC } from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CustomButton from '@components/common/CustomButton';
import BaseInput from '@components/common/BaseInput';
import Autocomplete from '@mui/material/Autocomplete';
import MenuItem from '@mui/material/MenuItem';
import CustomDatePicker from '@components/common/CustomDatePicker';
import type { FetchPricingParams } from '@features/pricing/state';

export interface PricingFilterPanelProps {
  onApply: (filters: FetchPricingParams) => void;
  onReset?: () => void;
  initialFilters?: FetchPricingParams;
  
  // New props for dropdown options
  brandOptions?: string[];
  countryCodeOptions?: string[];
  pricingTypeOptions?: string[];
  sizeLabelOptions?: string[];
}

const PricingFilterPanel: FC<PricingFilterPanelProps> = ({
                                                           onApply,
                                                           onReset,
                                                           initialFilters = {},
                                                           brandOptions = [],
                                                           countryCodeOptions = [],
                                                           pricingTypeOptions = [],
                                                           sizeLabelOptions = [],
                                                         }) => {
  const [filters, setFilters] = useState<FetchPricingParams>(initialFilters);
  
  const FILTER_OPTIONS: {
    label: string;
    key: keyof NonNullable<FetchPricingParams['filters']>;
    options?: string[];
  }[] = [
    { label: 'Brand', key: 'brand', options: brandOptions },
    { label: 'Country Code', key: 'countryCode', options: countryCodeOptions },
    { label: 'Pricing Type', key: 'pricingType', options: pricingTypeOptions },
    { label: 'Size Label', key: 'sizeLabel', options: sizeLabelOptions },
  ];
  
  const handleFilterFieldChange = (field: keyof NonNullable<FetchPricingParams['filters']>) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFilters((prev) => ({
        ...prev,
        filters: {
          ...(prev.filters ?? {}), // ensure it's not undefined
          [field]: value,
        },
      }));
    };
  
  const handleDateChange = (field: 'validFrom' | 'validTo') => (date: Date | null) => {
    setFilters((prev) => ({
      ...prev,
      filters: {
        ...(prev.filters ?? {}),
        [field]: date ? date.toISOString() : '',
      },
    }));
  };
  
  const handleApply = () => {
    const { validFrom, validTo } = filters.filters || {};
    const hasOnlyOneDate = (validFrom && !validTo) || (!validFrom && validTo);
    if (hasOnlyOneDate) {
      // You could show a toast or alert if needed
      alert('Please provide both "Valid From" and "Valid To" dates.');
      return;
    }
    onApply(filters);
  };
  
  const handleReset = () => {
    setFilters({});
    onReset?.();
  };
  
  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        backgroundColor: 'background.default',
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        alignItems="flex-start"
        justifyContent="flex-start"
      >
        {FILTER_OPTIONS.map(({ label, key, options }) => {
          const inputId = `filter-${key}`;
          const value = filters.filters?.[key] ?? '';
          
          return (
            <BaseInput
              key={key}
              name={key}
              select={!!options}
              value={value}
              label={label}
              size="small"
              onChange={handleFilterFieldChange(key)}
              slotProps={{
                input: { id: inputId },
                inputLabel: { htmlFor: inputId },
              }}
              sx={{
                minWidth: 180,
                flexGrow: 1,
                '& .MuiInputBase-root': {
                  borderRadius: '24px',
                },
              }}
            >
              {options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </BaseInput>
          );
        })}
        <Autocomplete
          options={['Focus', 'NMN', 'Seal Oil', 'PRC']}
          freeSolo
          value={filters.keyword || ''}
          onInputChange={(_event, value) => {
            setFilters((prev) => ({
              ...prev,
              keyword: value,
            }));
          }}
          size="small"
          sx={{
            minWidth: 200,
            flexGrow: 1,
            '& .MuiInputBase-root': {
              borderRadius: '24px',
              height: '40px',
            },
          }}
          renderInput={(params) => (
            <BaseInput
              {...params}
              label="Keyword"
              size="small"
              placeholder="Search name or code"
            />
          )}
        />
        
        <CustomDatePicker
          label="Valid From"
          value={filters.filters?.validFrom || null}
          onChange={handleDateChange('validFrom')}
          sx={{ maxWidth: 180, flexGrow: 1 }}
        />
        
        <CustomDatePicker
          label="Valid To"
          value={filters.filters?.validTo || null}
          onChange={handleDateChange('validTo')}
          sx={{ maxWidth: 180, flexGrow: 1 }}
        />
        
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <CustomButton variant="outlined" onClick={handleApply}>
            Apply
          </CustomButton>
          <CustomButton variant="text" onClick={handleReset}>
            Reset
          </CustomButton>
        </Stack>
      </Stack>
    </Box>
  );
};

export default PricingFilterPanel;
