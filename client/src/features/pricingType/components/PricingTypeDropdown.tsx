import { FC, useEffect, useState } from 'react';
import Dropdown from '@components/common/Dropdown';
import { usePricingTypeDropdown } from '../../../hooks';
import Box from '@mui/material/Box';
import { Loading } from '@components/index.ts';

interface PricingTypeDropdownProps {
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  productId: string | null;  // New prop for product ID
  onAddNew?: () => void;
  disabled?: boolean;
}

// Type for the formatted options passed to the Dropdown
interface FormattedOption {
  value: string;
  label: string;
}

const PricingTypeDropdown: FC<PricingTypeDropdownProps> = ({
                                                             label = 'Select Pricing Type',
                                                             value,
                                                             onChange,
                                                             productId,
                                                             onAddNew,
                                                             disabled = false,
                                                           }) => {
  const { pricingTypes, loading, error, refreshPricingTypes } = usePricingTypeDropdown(productId || '');  // Pass productId to hook
  const [options, setOptions] = useState<FormattedOption[]>([]);
  
  // Update options when pricingTypes data changes
  useEffect(() => {
    if (pricingTypes.length > 0) {
      setOptions(pricingTypes.map((type) => ({
        value: type.id,
        label: type.label,
      })));
    }
  }, [pricingTypes]);
  
  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center">
        <Loading />
      </Box>
    );
  }
  
  if (error) {
    return <div>Error loading pricing types: {error}</div>;
  }
  
  return (
    <Dropdown
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      onAddNew={onAddNew}
      onRefresh={refreshPricingTypes}
      disabled={disabled || !productId}  // Disable if no productId is provided
      searchable
    />
  );
};

export default PricingTypeDropdown;
