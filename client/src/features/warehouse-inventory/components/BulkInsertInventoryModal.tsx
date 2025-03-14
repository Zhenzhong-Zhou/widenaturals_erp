import { FC, useState } from 'react';
import {
  CustomButton,
  CustomDatePicker,
  CustomModal,
  Loading,
  MultiItemForm,
} from '@components/index';
import Box from '@mui/material/Box';
import { InventoryDropdown, ProductDropdownItem } from '../index.ts';
import { useProductsDropdown } from '../../../hooks';
import { formatDate } from '@utils/dateTimeUtils.ts';

const BulkInsertInventoryModal: FC<{
  warehouseId: string;
  onSubmit: (data: Record<string, any>[]) => void;
  mode: 'create' | 'edit' | 'adjust';
}> = ({ warehouseId, onSubmit, mode }) => {
  const [open, setOpen] = useState(false);
  const { products, loading } = useProductsDropdown(warehouseId); // Fetch products for the given warehouseId

  // Product dropdown options
  const productOptions = products.map((p: ProductDropdownItem) => ({
    value: p.product_id,
    label: p.product_name,
  }));

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const getValidationRules =
    (mode: 'create' | 'edit' | 'adjust') => (watch: (name: string) => any) => ({
      quantity: (value: number) => {
        if (mode === 'create' && value <= 0)
          return 'Quantity must be greater than 0';
        if (mode === 'adjust' && value === 0)
          return 'Adjustment quantity cannot be zero';
        return undefined;
      },
      product_id: (value: string) => {
        if (
          watch('items')?.some(
            (item: any) =>
              item.type === 'product' && (!value || value.trim() === '')
          )
        ) {
          return 'Product ID is required for products';
        }
        return undefined;
      },
      lot_number: (value: string) => {
        if (
          watch('items')?.some(
            (item: any) => item.type && (!value || value.trim() === '')
          )
        ) {
          return 'Lot number is required for all items';
        }
        return undefined;
      },
      manufacture_date: (value: string) => {
        if (
          watch('items')?.some(
            (item: any) =>
              item.type === 'product' && (!value || value.trim() === '')
          )
        ) {
          return 'Manufacture date is required for products';
        }
        return undefined;
      },
      expiry_date: (value: string) => {
        if (
          watch('items')?.some(
            (item: any) =>
              item.type === 'product' && (!value || value.trim() === '')
          )
        ) {
          return 'Expiry date is required for products';
        }
        return undefined;
      },
    });

  return (
    <>
      <CustomButton variant="contained" color="primary" onClick={handleOpen}>
        Bulk Insert Inventory
      </CustomButton>

      <CustomModal
        open={open}
        onClose={handleClose}
        title="Bulk Insert Inventory"
        sx={{
          maxWidth: '100vw',
          width: 'auto',
          minWidth: '75vw',
          maxHeight: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <Loading message={'Loading Data...'} />
        ) : (
          <Box
            style={{ maxHeight: '80vh', overflowY: 'auto', padding: '16px' }}
          >
            <MultiItemForm
              validation={getValidationRules(mode)}
              defaultValues={[{ type: 'product' }]}
              fields={[
                {
                  id: 'type',
                  label: 'Type',
                  type: 'select',
                  options: [
                    { value: 'product', label: 'Product' },
                    { value: 'raw_material', label: 'Raw Material' },
                    {
                      value: 'packaging_material',
                      label: 'Packaging Material',
                    },
                    { value: 'sample', label: 'Sample' },
                  ],
                },
                {
                  id: 'identifier',
                  label: 'Identifier',
                  type: 'text',
                  conditional: (data) => data.type !== 'product',
                },
                {
                  id: 'product_id',
                  label: 'Product',
                  type: 'custom',
                  conditional: (data) => data.type === 'product',
                  component: ({ value, onChange }) => (
                    <InventoryDropdown
                      label="Product"
                      options={productOptions}
                      value={value}
                      onChange={onChange}
                      searchable
                    />
                  ),
                },
                {
                  id: 'manufacture_date',
                  label: 'Manufacture Date',
                  type: 'custom',
                  component: ({ value, onChange }) => (
                    <CustomDatePicker
                      label="Manufacture Date"
                      value={value ? new Date(value) : null} // Ensure value is Date
                      onChange={(date) =>
                        onChange(date ? formatDate(date) : '')
                      } // Convert Date to string before passing
                      sx={{ width: '250px' }}
                      inputSx={{ width: '250px' }}
                    />
                  ),
                },
                {
                  id: 'lot_number',
                  label: 'Lot Number',
                  type: 'text',
                },
                {
                  id: 'expiry_date',
                  label: 'Expiry Date',
                  type: 'custom',
                  component: ({ value, onChange }) => (
                    <CustomDatePicker
                      label="Expiry Date"
                      value={value ? new Date(value) : null} // Ensure value is Date
                      onChange={(date) =>
                        onChange(date ? formatDate(date) : '')
                      } // Convert Date to string before passing
                      sx={{ width: '250px' }}
                      inputSx={{ width: '250px' }}
                    />
                  ),
                },
                {
                  id: 'quantity',
                  label: 'Quantity',
                  type: 'number',
                  validation: (value: number) =>
                    value <= 0 ? 'Quantity must be greater than 0' : undefined,
                },
              ]}
              onSubmit={(formData) => {
                onSubmit(formData);
                handleClose();
              }}
            />
          </Box>
        )}
      </CustomModal>
    </>
  );
};

export default BulkInsertInventoryModal;
