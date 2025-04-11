import { type FC, lazy, Suspense } from 'react';
import Box from '@mui/material/Box';
import { formatDate } from '@utils/dateTimeUtils';
import useProductsWarehouseDropdown from '@hooks/useProductsWarehouseDropdown';
import type { ProductDropdownItem } from '@features/warehouse-inventory';
import CustomModal from '@components/common/CustomModal';
import Loading from '@components/common/Loading';
import MultiItemForm from '@components/common/MultiItemForm';
import InventoryDropdown from '@features/warehouse-inventory/components/InventoryDropdown';

const CustomDatePicker = lazy(
  () => import('@components/common/CustomDatePicker')
);

const BulkInsertInventoryModal: FC<{
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  onSubmit: (data: Record<string, any>[]) => void;
  mode: 'create' | 'edit' | 'adjust';
}> = ({ open, onClose, warehouseId, onSubmit, mode }) => {
  const { products, loading, refreshProducts } =
    useProductsWarehouseDropdown(warehouseId); // Fetch products for the given warehouseId

  // Product dropdown options
  const productOptions = products.map((p: ProductDropdownItem) => ({
    value: p.product_id,
    label: p.product_name,
  }));

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
    <CustomModal
      open={open}
      onClose={onClose}
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
        <Box style={{ maxHeight: '80vh', overflowY: 'auto', padding: '16px' }}>
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
                    onRefresh={refreshProducts}
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
                    onChange={(date) => onChange(date ? formatDate(date) : '')} // Convert Date to string before passing
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
                  <Suspense
                    fallback={<Loading message={'Loading date picker...'} />}
                  >
                    <CustomDatePicker
                      label="Expiry Date"
                      value={value ? new Date(value) : null}
                      onChange={(date) =>
                        onChange(date ? formatDate(date) : '')
                      }
                      sx={{ width: '250px' }}
                      inputSx={{ width: '250px' }}
                    />
                  </Suspense>
                ),
              },
              {
                id: 'quantity',
                label: 'Quantity',
                type: 'number',
                validation: (value: number) =>
                  value <= 0 ? 'Quantity must be greater than 0' : undefined,
              },
              {
                id: 'reserved_quantity',
                label: 'Reserved Quantity',
                type: 'number',
                validation: (value: number) =>
                  value <= 0
                    ? 'Reserved quantity must be greater than 0'
                    : undefined,
              },
            ]}
            onSubmit={(formData) => {
              onSubmit(formData);
            }}
          />
        </Box>
      )}
    </CustomModal>
  );
};

export default BulkInsertInventoryModal;
