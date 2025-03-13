import { FC, useState } from 'react';
import Box from '@mui/material/Box';
import { FieldConfig } from '@components/common/CustomForm.tsx';
import { CustomButton, CustomForm, CustomModal } from '@components/index.ts';
import { useCustomers } from '../../../hooks';
import { useForm } from 'react-hook-form';
import { BulkCustomerRequest, CustomerRequest } from '../state/customerTypes.ts';

const CreateCustomerModal: FC = () => {
  const [open, setOpen] = useState(false);
  const { createCustomer, loading, refresh } = useCustomers();
  const { control, handleSubmit, reset } = useForm<CustomerRequest>();
  
  const handleFormSubmit = () =>
    handleSubmit(async (formData) => {
      if (loading) return;
      
      const customersData: BulkCustomerRequest = [formData as CustomerRequest];
      
      await createCustomer(customersData);
      reset();
      setOpen(false);
      refresh();
    })();
  
  const fields: FieldConfig[] = [
    { id: "firstname", label: "First Name", type: "text", required: true },
    { id: "lastname", label: "Last Name", type: "text", required: true },
    { id: "email", label: "Email", type: "text", required: true },
    { id: "phone_number", label: "Phone Number", type: "phone" },
    { id: "address", label: "Address", type: "text" },
    { id: "note", label: "Note", type: "textarea", rows: 3 },
  ];
  
  return (
    <Box>
      {/* Trigger Button */}
      <CustomButton variant="contained" onClick={() => setOpen(true)}>
        Create Customer
      </CustomButton>
      
      {/* Modal with Form */}
      <CustomModal open={open} onClose={() => setOpen(false)} title="Create Customer">
        <CustomForm fields={fields} control={control} onSubmit={handleFormSubmit} />
      </CustomModal>
    </Box>
  );
};

export default CreateCustomerModal;
