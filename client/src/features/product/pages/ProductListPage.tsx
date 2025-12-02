import { useState } from "react";
import Box from "@mui/material/Box";
import CustomButton from "@components/common/CustomButton";
import { ProductsCreateDialog } from '@features/product/components/CreateProductForm';

const ProductListPage = () => {
  const [open, setOpen] = useState(false);
  
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header Action Button */}
      <CustomButton onClick={handleOpen} variant="contained" color="primary">
        Create Product
      </CustomButton>
      
      {/* Modal Dialog */}
      <ProductsCreateDialog
        open={open}
        onClose={handleClose}
      />
    </Box>
  );
};

export default ProductListPage;
