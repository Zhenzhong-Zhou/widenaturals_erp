import { FC, useEffect, useState } from 'react';
import Dropdown from '@components/common/Dropdown';
import useDiscountDropdown from '@hooks/useDiscountDropdown';
import Loading from '@components/common/Loading';
import Box from '@mui/material/Box';

interface DiscountDropdownProps {
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  onAddNew?: () => void;
  disabled?: boolean;
}

// Type for the formatted options passed to the Dropdown
interface FormattedOption {
  value: string;
  label: string;
}

const DiscountDropdown: FC<DiscountDropdownProps> = ({
                                                       label = 'Select Discount',
                                                       value,
                                                       onChange,
                                                       onAddNew,
                                                       disabled = false,
                                                     }) => {
  const { discounts, loading, error, refreshDiscounts } = useDiscountDropdown();
  const [options, setOptions] = useState<FormattedOption[]>([]);
  
  // Update options whenever discounts change
  useEffect(() => {
    if (discounts.length > 0) {
      const formattedOptions = discounts.map((discount) => ({
        value: discount.value,
        label: discount.label,
      }));
      setOptions(formattedOptions);
    }
  }, [discounts]);
  
  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center">
        <Loading />
      </Box>
    );
  }
  
  if (error) {
    return <div>Error loading discounts: {error}</div>;
  }
  
  return (
    <Dropdown
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      onAddNew={onAddNew}
      onRefresh={refreshDiscounts}
      disabled={disabled}
      searchable
    />
  );
};

export default DiscountDropdown;
