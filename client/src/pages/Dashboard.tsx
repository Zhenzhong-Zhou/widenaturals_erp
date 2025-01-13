import { FC, useState } from 'react';
import { Chip, Box } from '@mui/material';
import { CustomButton, DataTable, Form } from '@components/index';
import { FieldConfig } from '../components/common/Form';
import CustomModal from '@components/common/CustomModal.tsx';

const Dashboard: FC = () => {
  const [open, setOpen] = useState(false);
  
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const handleApprove = (row: any) => {
    console.log(`Approved: ${row.name}`);
  };
  
  const handleCancel = (row: any) => {
    console.log(`Cancelled: ${row.name}`);
  };
  
  const fields: FieldConfig[] = [
    { id: 'name', label: 'Name', type: 'text', required: true }, // Text field
    {
      id: 'role',
      label: 'Role',
      type: 'select', // Dropdown
      required: true,
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
      ],
    },
    { id: 'newsletter', label: 'Subscribe to Newsletter', type: 'checkbox' }, // Checkbox
  ];
  
  const handleSubmit = (formData: Record<string, any>) => {
    console.log('Form Data:', formData);
  };
  
  return (
    <>
      <DataTable
        columns={[
          { id: 'name', label: 'Name', sortable: true },
          {
            id: 'status',
            label: 'Status',
            sortable: true,
            format: (value) => <Chip label={value} color={getStatusColor(value)} />,
          },
          {
            id: 'actions',
            label: 'Actions',
            sortable: false,
            format: (_, row) => (
              <Box>
                {row.status === 'Pending' && (
                  <>
                    <CustomButton
                      variant="outlined"
                      color="primary"
                      onClick={() => handleApprove(row)}
                      size="small"
                      sx={{ marginRight: 1 }}
                    >
                      Approve
                    </CustomButton>
                    <CustomButton
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleCancel(row)}
                      size="small"
                    >
                      Cancel
                    </CustomButton>
                  </>
                )}
              </Box>
            ),
          },
        ]}
        
        data={[
          { id: 1, name: 'Alice', status: 'Pending' },
          { id: 2, name: 'Bob', status: 'Approved' },
          { id: 3, name: 'Charlie', status: 'Cancelled' },
        ]}
      />
      
      <div>
        <h1>Dynamic Form</h1>
        <Form fields={fields} onSubmit={handleSubmit} />
      </div>
      
      <div>
        <CustomButton variant="contained" color="primary" onClick={handleOpen}>
          Open Modal
        </CustomButton>
        <CustomModal
          open={open}
          onClose={handleClose}
          title="Example Modal"
          actions={
            <>
              <CustomButton onClick={handleClose} color="secondary" variant="outlined">
                Cancel
              </CustomButton>
              <CustomButton onClick={handleClose} color="primary" variant="contained">
                Confirm
              </CustomButton>
            </>
          }
        >
          <p>This is the content inside the modal. You can customize it as needed.</p>
        </CustomModal>
      </div>
    </>
  );
};

export default Dashboard;
