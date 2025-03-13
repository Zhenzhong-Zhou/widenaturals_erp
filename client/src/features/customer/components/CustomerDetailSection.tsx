import { FC } from "react";
import Box from "@mui/material/Box";
import { CustomButton, ErrorDisplay, ErrorMessage, Loading, MetadataSection } from '@components/index';
import { formatDateTime } from '@utils/dateTimeUtils.ts';

interface CustomerDetailsProps {
  customer: {
    email: string;
    phone_number: string;
    address: string;
    note?: string;
    status_name: string;
    status_date: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at?: string | null;
  };
  loading: boolean;
  error: string | null;
}

const CustomerDetailSection: FC<CustomerDetailsProps> = ({ customer, loading, error }) => {
  
  if (loading) return <Loading message={'Loading customer details...'} />;
  if (error)
    return <ErrorDisplay><ErrorMessage message={error}/></ErrorDisplay>;
  
  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      {/* Metadata Section */}
      <MetadataSection
        data={{
          Email: customer.email,
          "Phone Number": customer.phone_number,
          Address: customer.address,
          Note: customer.note || "N/A",
          Status: customer.status_name,
          "Status Date": formatDateTime(customer.status_date),
          "Created By": customer.created_by,
          "Created At": formatDateTime(customer.created_at),
          "Updated By": customer.updated_by,
          "Updated At": customer.updated_at
            ? formatDateTime(customer.updated_at)
            : "N/A",
        }}
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0.05)",
          padding: 2,
          borderRadius: 1
        }}
      />
      
      {/* Actions */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <CustomButton variant="contained" color="primary">
          Edit Customer
        </CustomButton>
      </Box>
    </Box>
  );
};

export default CustomerDetailSection;
