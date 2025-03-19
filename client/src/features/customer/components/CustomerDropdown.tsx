import { FC } from 'react';
import { useCustomerDropdown } from '../../../hooks';
import Dropdown from '@components/common/Dropdown.tsx';

interface CustomerDropdownProps {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  sx?: object;
}

/**
 * Reusable Customer Dropdown Component.
 * Fetches and displays a list of customers with search functionality.
 */
const CustomerDropdown: FC<CustomerDropdownProps> = ({ value, onChange, disabled = false, sx }) => {
  const { customers, loading, error, fetchCustomers } = useCustomerDropdown();
  
  // Format options for Dropdown
  const options = customers.map((customer) => ({
    value: customer.id,
    label: customer.label,
  }));
  
  return (
    <Dropdown
      label="Select Customer"
  options={options}
  value={value}
  onChange={onChange}
  searchable
  disabled={loading || disabled}
  sx={sx}
  />
);
};

export default CustomerDropdown;
