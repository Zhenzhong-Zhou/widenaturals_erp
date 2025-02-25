import { FC, useState } from 'react';
import { CustomButton, CustomDatePicker, CustomModal, Loading, MultiItemForm } from '@components/index';
import { InventoryDropdown, ProductDropdownItem } from '../index.ts';
import { useDropdown } from '../../../hooks';

const BulkInsertInventoryModal: FC<{ warehouseId: string; onSubmit: (data: Record<string, any>[]) => void; mode: 'create' | 'edit' | 'adjust' }> = ({ warehouseId, onSubmit, mode }) => {
  const [open, setOpen] = useState(false);
  const { products, loading } = useDropdown(warehouseId); // Fetch products for the given warehouseId
  
  // Product dropdown options
  const productOptions = products.map((p: ProductDropdownItem) => ({
    value: p.product_id,
    label: p.product_name,
  }));
  
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  const getValidationRules = (mode: 'create' | 'edit' | 'adjust') => ({
    quantity: (value: number) => {
      if (mode === 'create' && value <= 0) return 'Quantity must be greater than 0';
      if (mode === 'adjust' && value === 0) return 'Adjustment quantity cannot be zero';
      return undefined;
    },
  });
  
  return (
    <>
      <CustomButton variant="contained" color="primary" onClick={handleOpen}>
        Bulk Insert Inventory
      </CustomButton>
      
      <CustomModal open={open} onClose={handleClose} title="Bulk Insert Inventory">
        {loading ? (
          <Loading message={'Loading Data...'} />
        ) : (
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
                  { value: 'packaging_material', label: 'Packaging Material' },
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
                    value={value}
                    onChange={onChange}
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
                component: ({ value, onChange }) => {
                  return (
                    <CustomDatePicker
                      label="Expiry Date"
                      value={value}
                      onChange={onChange}
                    />
                  );
                },
              },
              {
                id: 'quantity',
                label: 'Quantity',
                type: 'number',
                validation: (value: number) => (value <= 0 ? 'Quantity must be greater than 0' : undefined),
              },
            ]}
            onSubmit={(formData) => {
              onSubmit(formData);
              handleClose();
            }}
          />
        )}
      </CustomModal>
    </>
  );
};

export default BulkInsertInventoryModal;
