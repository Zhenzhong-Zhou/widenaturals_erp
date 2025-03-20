import { FC } from 'react';
import { FieldConfig } from '@components/common/CustomForm.tsx';
import { CustomForm, CustomModal } from '@components/index.ts';
import { useCustomers } from '../../../hooks';
import { useForm } from 'react-hook-form';
import {
  BulkCustomerRequest,
  CustomerRequest,
} from '../state/customerTypes.ts';

interface CreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal for Creating a New Customer.
 */
const CreateCustomerModal: FC<CreateCustomerModalProps> = ({ open, onClose }) => {
  const { createCustomer, loading, refreshCustomers } = useCustomers();
  const { control, handleSubmit, reset } = useForm<CustomerRequest>();
  
  const handleFormSubmit = () =>
    handleSubmit(async (formData) => {
      if (loading) return;
      
      const customersData: BulkCustomerRequest = [formData as CustomerRequest];
      
      await createCustomer(customersData);
      reset();
      onClose();
      refreshCustomers();
    })();
  
  const fields: FieldConfig[] = [
    { id: 'firstname', label: 'First Name', type: 'text', required: true },
    { id: 'lastname', label: 'Last Name', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'text', required: true },
    { id: 'phone_number', label: 'Phone Number', type: 'phone' },
    { id: 'address', label: 'Address', type: 'text' },
    { id: 'note', label: 'Note', type: 'textarea', rows: 3 },
  ];
  
  return (
    <CustomModal open={open} onClose={onClose} title="Create Customer">
      <CustomForm fields={fields} control={control} onSubmit={handleFormSubmit} />
    </CustomModal>
  );
};

export default CreateCustomerModal;
