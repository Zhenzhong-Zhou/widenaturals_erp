import { FC, useState } from 'react';
import { CustomButton, CustomModal, Loading, MultiItemForm } from '@components/index';
import { InventoryDropdown } from '../index.ts';
import useDropdown from '../../../hooks/useDropdown';

const BulkInsertInventoryModal: FC<{ onSubmit: (data: Record<string, any>[]) => void }> = ({ onSubmit }) => {
  const [open, setOpen] = useState(false);
  const { products, warehouses, loading } = useDropdown();
  
  const productOptions = products.map((p) => ({ value: p.id, label: p.product_name }));
  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: w.name }));
  console.log(productOptions)
  console.log(warehouseOptions)
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  return (
    <>
      <CustomButton variant="contained" color="primary" onClick={handleOpen}>
        Bulk Insert Inventory
      </CustomButton>
      
      <CustomModal open={open} onClose={handleClose} title="Bulk Insert Inventory">
        {loading ? (
          <Loading message={'Loading Data...'}/>
        ) : (
          <MultiItemForm
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
                  { value: 'sample', label: 'Sample' }
                ]
              },
              {
                id: 'identifier',
                label: 'Identifier',
                type: 'text',
                conditional: (data) => data.type !== 'product'
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
                )
              },
              {
                id: 'warehouse_id',
                label: 'Warehouse',
                type: 'custom',
                component: ({ value, onChange }) => (
                  <InventoryDropdown
                    label="Warehouse"
                    options={warehouseOptions}
                    value={value}
                    onChange={onChange}
                    searchable
                  />
                )
              },
              { id: 'manufacture_date', label: 'Manufacture Date', type: 'text' },
              { id: 'lot_number', label: 'Lot Number', type: 'text' },
              { id: 'expiry_date', label: 'Expiry Date', type: 'text' },
              { id: 'quantity', label: 'Quantity', type: 'number' },
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
