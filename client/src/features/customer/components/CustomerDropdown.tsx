import { type FC, useState, useEffect } from 'react';
import useCustomerDropdown from '@hooks/useCustomerDropdown';
import Dropdown from '@components/common/Dropdown';
import CreateCustomerModal from '@features/customer/components/CreateCustomerModal';

interface CustomerDropdownProps {
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  sx?: object;
}

/**
 * Reusable Customer Dropdown Component with Refresh & Add Customer inside the dropdown menu.
 */
const CustomerDropdown: FC<CustomerDropdownProps> = ({ value, onChange, disabled = false, sx }) => {
  const { customers, loading, fetchCustomers } = useCustomerDropdown();
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<{ value: string | null; label: string }[]>([]);
  
  // Update dropdown options when customers change
  useEffect(() => {
    setDropdownOptions(
      customers.map((customer) => ({
        value: customer.id,
        label: customer.label,
      }))
    );
  }, [customers]);
  
  return (
    <>
      {/* Pass modal open state to CustomPaper inside Dropdown */}
      <Dropdown
        label="Select Customer"
        options={dropdownOptions}
        value={value}
        onChange={onChange}
        searchable
        disabled={loading || disabled}
        sx={sx}
        onRefresh={() => fetchCustomers()}
        onAddNew={() => setModalOpen(true)}
      />
      
      {/*/!* Modal: Controlled by CustomerDropdown *!/*/}
      <CreateCustomerModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default CustomerDropdown;
