import { FC, useEffect, useMemo, useState } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { BaseInput, CustomButton, CustomDatePicker, CustomForm } from '@components/index';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { v4 as uuidv4 } from 'uuid';
import { CustomerDropdown } from '../../customer';
import { DiscountDropdown } from '../../discount';
import { TaxRateDropdown } from '../../taxRate';
import { DeliveryMethodDropdown } from '../../deliveryMethod';
import { ProductOrderDropdown } from '../../product';
import { PricingTypeDropdown } from '../../pricingType';
import { SalesOrder } from '../state/orderTypes.ts';

interface SaleOrderFormProps {
  onSubmit: (formData: SalesOrder) => void | Promise<void>;
  onClose: () => void;
}

interface SaleOrderItem {
  id: string;
  product_id: string;
  price_type_id: string;
  price: number;
  quantity_ordered: number;
}

const CreateSaleOrderForm: FC<SaleOrderFormProps> = ({ onSubmit = () => {}, onClose = () => {} }) => {
  const [items, setItems] = useState<SaleOrderItem[]>([
    { id: uuidv4(), product_id: '', price_type_id: '', price: 0, quantity_ordered: 1 }
  ]);  // Initialized with one item
  
  // Initialize useForm with your defined structure
  const methods = useForm<SalesOrder>({
    mode: 'onChange',
    defaultValues: {
      customer_id: '',
      order_date: '',
      discount_id: null,
      tax_rate_id: '',
      delivery_method_id: '',
      note: '',
      items: [
        {
          product_id: '',
          price_type_id: '',
          price: 0,
          quantity_ordered: 1,
        }
      ]
    }
  });
  
  const { handleSubmit, control, formState: { isValid } } = methods;  // Extract control
  
  useEffect(() => {
    if (items.length === 0) {
      // Ensure there is always at least one item
      setItems([{ id: uuidv4(), product_id: '', price_type_id: '', price: 0, quantity_ordered: 1 }]);
    }
    // Always synchronize form state with items state
    methods.setValue('items', items);
  }, [items, methods]);
  
  const handleAddItem = () => {
    const newItem = {
      id: uuidv4(),
      product_id: '',
      price_type_id: '',
      price: 0,
      quantity_ordered: 1
    };
    
    // Update the state only
    setItems((prevItems) => [...prevItems, newItem]);
  };
  
  // Function to check if all fields are completed
  const areAllFieldsCompleted = () => {
    const customer_id = methods.getValues('customer_id');
    const order_date = methods.getValues('order_date');
    const tax_rate_id = methods.getValues('tax_rate_id');
    const delivery_method_id = methods.getValues('delivery_method_id');
    
    // Check if main required fields are filled
    const isMainFormCompleted = !!(customer_id && order_date && tax_rate_id && delivery_method_id);
    
    // Check if all items are completed
    const areItemsCompleted = items.every((_item, index) => {
      const product_id = methods.getValues(`items.${index}.product_id`);
      const price_type_id = methods.getValues(`items.${index}.price_type_id`);
      const price = methods.getValues(`items.${index}.price`);
      const quantity_ordered = methods.getValues(`items.${index}.quantity_ordered`);
      
      // Check if all required fields of the item are filled
      return (
        product_id &&
        price_type_id &&
        price >= 0 &&
        quantity_ordered > 0
      );
    });
    
    // Return true only if all required fields are filled
    return isMainFormCompleted && areItemsCompleted;
  };
  
  const isFormValid = useMemo(() => areAllFieldsCompleted(), [items, methods.watch()]);
  
  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return; // Prevent removal of the only remaining item
    
    const updatedItems = items.filter(item => item.id !== id);
    
    setItems(updatedItems);
    methods.reset({ items: updatedItems }); // Reset form data with the updated items
  };
  
  const handleItemChange = <K extends keyof SaleOrderItem>(
    id: string,
    key: K,
    value: SaleOrderItem[K]
  ) => {
    setItems((prev) =>
      prev.map(item =>
        item.id === id ? { ...item, [key]: value } : item
      )
    );
  };
  
  const handleFormSubmit = () =>
    handleSubmit((formData: SalesOrder) => {  // Wrap with methods.handleSubmit()
      formData.items = items; // Attach your items array
      onSubmit(formData); // Call parent onSubmit function
      onClose(); // Close the modal after submission
    })();
  
  
  return (
    <FormProvider {...methods}>
      <CustomForm control={control} onSubmit={handleFormSubmit} showSubmitButton={isValid && isFormValid} >
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 8 }}>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <CustomerDropdown
                  label="Select Customer"
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </Grid>
          
          
          <Grid size={{ xs: 6, md: 8 }}>
            <Controller
              name="order_date"
              control={control}
              render={({ field }) => (
                <CustomDatePicker
                  label="Order Date"
                  value={field.value || null}
                  onChange={(date) => field.onChange(date)}
                />
              )}
            />
          </Grid>
          
          <Grid size={{ xs: 6, md: 8 }}>
            <Controller
              name="discount_id"
              control={control}
              render={({ field }) => (
                <DiscountDropdown
                  label="Select Discount"
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </Grid>
          
          <Grid size={{ xs: 6, md: 8 }}>
            <Controller
              name="tax_rate_id"
              control={control}
              render={({ field }) => (
                <TaxRateDropdown
                  label="Select Tax Rate"
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </Grid>
          
          <Grid size={{ xs: 6, md: 8 }}>
            <Controller
              name="delivery_method_id"
              control={control}
              render={({ field }) => (
                <DeliveryMethodDropdown
                  label="Select Delivery Method"
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  includePickup={true}
                />
              )}
            />
          </Grid>
          
          <Grid size={{ xs: 6, md: 8 }}>
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Note"
                  value={field.value || ''}   // Ensure it's never undefined
                  onChange={field.onChange}   // Pass onChange directly
                  fullWidth                  // Make it occupy full width of the Grid cell
                  multiline                  // Allow multiple lines
                  rows={4}                   // Provide sufficient space for text input
                  placeholder="Enter additional information"
                />
              )}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>
        
        {items.map((item, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                
                <Grid size={{ xs: 6, md: 8 }}>
                  <Controller
                    name={`items.${index}.product_id`}  // Corrected name syntax for react-hook-form
                    control={control}
                    render={({ field }) => (
                      <ProductOrderDropdown
                        label="Select Product"
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val); // Update react-hook-form state
                          handleItemChange(item.id, 'product_id', val); // Update local state
                        }}// Use field.onChange to update form state
                      />
                    )}
                  />
                </Grid>
                
                <Grid size={{ xs: 6, md: 8 }}>
                  <Controller
                    name={`items.${index}.price_type_id`}  // Corrected name syntax for react-hook-form
                    control={control}
                    render={({ field }) => (
                      <PricingTypeDropdown
                        label="Select Pricing Type"
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val); // Update react-hook-form state
                          handleItemChange(item.id, 'price_type_id', val); // Update local state
                        }}  // Use field.onChange to update form state
                      />
                    )}
                  />
                </Grid>
                
                <Grid size={{ xs: 6, md: 8 }}>
                  <Controller
                    name={`items.${index}.price`}
                    control={control}
                    defaultValue={item.price || 0}
                    render={({ field }) => (
                      <BaseInput
                        type="number"
                        label="Price"
                        placeholder="Price"
                        value={field.value || 0}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0);
                        }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">$</InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                
                <Grid size={{ xs: 6, md: 8 }}>
                  <Controller
                    name={`items.${index}.quantity_ordered`}
                    control={control}
                    defaultValue={item.quantity_ordered || 1}
                    render={({ field }) => (
                      <BaseInput
                        type="number"
                        label="Quantity"
                        placeholder="Quantity"
                        value={field.value || 1}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          handleItemChange(item.id, 'quantity_ordered', parseInt(e.target.value) || 1);
                        }}
                      />
                    )}
                  />
                </Grid>
                
                {/* Remove Button */}
                <Grid size={{ xs: 6, md: 8 }}>
                  {items.length > 1 && (
                    <CustomButton onClick={() => handleRemoveItem(item.id)} color="error">
                      Remove
                    </CustomButton>
                  )}
                </Grid>
              
              </Grid>
            </CardContent>
          </Card>
        ))}
        
        {isFormValid && (
          <CustomButton type="button" onClick={handleAddItem} variant="outlined">
            Add Product
          </CustomButton>
        )}
      </CustomForm>
    </FormProvider>
  );
};

export default CreateSaleOrderForm;
