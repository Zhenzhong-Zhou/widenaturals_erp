import { type FC, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import CustomForm from '@components/common/CustomForm';
import CustomerDropdown from '@features/customer/components/CustomerDropdown';
import DiscountDropdown from '@features/discount/components/DiscountDropdown';
import TaxRateDropdown from '@features/taxRate/components/TaxRateDropdown';
import DeliveryMethodDropdown from '@features/deliveryMethod/components/DeliveryMethodDropdown';
import BaseInput from '@components/common/BaseInput';
import ProductOrderDropdown from '@features/product/components/ProductOrderDropdown';
import PricingTypeDropdown from '@features/pricingType/components/PricingTypeDropdown';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import Loading from '@components/common/Loading';
import { v4 as uuidv4 } from 'uuid';
import type { SalesOrder } from '../state';
import usePricing from '@hooks/usePricing';

const CustomDatePicker = lazy(() => import('@components/common/CustomDatePicker'));

interface SaleOrderFormProps {
  onSubmit: (formData: SalesOrder) => void | Promise<void>;
  onClose: () => void;
  category: string | null;
}

interface SaleOrderItem {
  id: string;
  product_id: string;
  price_type_id: string;
  price: number;
  quantity_ordered: number;
}

const CreateSaleOrderForm: FC<SaleOrderFormProps> = ({ onSubmit = () => {}, onClose = () => {}, category }) => {
  const [items, setItems] = useState<SaleOrderItem[]>([
    { id: uuidv4(), product_id: '', price_type_id: '', price: 0, quantity_ordered: 1 }
  ]);  // Initialized with one item
  const priceUpdatedRef = useRef(false);
  
  const { fetchPriceValue, priceValueData, priceValueLoading } = usePricing();
  
  // Initialize useForm with your defined structure
  const methods = useForm<SalesOrder>({
    mode: 'onChange',
    defaultValues: {
      customer_id: '',
      order_date: '',
      discount_id: null,
      tax_rate_id: '',
      delivery_method_id: '',
      has_shipping_info: false,
      shipping_info: {
        shipping_fullname: '',
        shipping_phone: '',
        shipping_email: '',
        shipping_address_line1: '',
        shipping_address_line2: '',
        shipping_city: '',
        shipping_state: '',
        shipping_postal_code: '',
        shipping_country: '',
        shipping_region: '',
      },
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
  
  const fetchPriceByProductAndPriceType = (productId: string, priceTypeId: string, itemId: string) => {
    if (productId && priceTypeId) {
      priceUpdatedRef.current = false;  // Allow price fetching for this item
      fetchPriceValue({ productId, priceTypeId }); // Fetch the price
      
      // Reset the price in react-hook-form and items state
      const itemIndex = items.findIndex(item => item.id === itemId); // Find the index of the item with the given id
      
      if (itemIndex !== -1) { // If the item exists in the list
        methods.setValue(`items.${itemIndex}.price`, 0);  // Reset form state price to 0
        
        // Update the state to reflect the price reset
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId ? { ...item, price: 0 } : item
          )
        );
      }
    }
  };
  
  useEffect(() => {
    if (priceValueData?.price && !priceUpdatedRef.current) {
      const priceValue = parseFloat(priceValueData.price);
      
      const updatedItems = items.map((item) => {
        const itemIndex = items.findIndex((i) => i.id === item.id);
        const currentFormPrice = methods.getValues(`items.${itemIndex}.price`);
        
        // Update if price is 0 (reset condition) or if product/priceType changed
        if (currentFormPrice === 0 || item.price === 0) {
          methods.setValue(`items.${itemIndex}.price`, priceValue); // Update form state
          return { ...item, price: priceValue };
        }
        return item;
      });
      
      setItems(updatedItems);  // Update state with new prices
      priceUpdatedRef.current = true;  // Prevent continuous updates
    }
  }, [priceValueData, methods, items]);
  
  const handleFormSubmit = () =>
    handleSubmit((formData: SalesOrder) => {
      formData.items = items; // Attach items array to the formData
      
      onSubmit(formData); // Submit the data
      onClose(); // Close the modal
      
      // Reset form data to the initial state
      methods.reset({
        customer_id: '',
        order_date: '',
        discount_id: null,
        tax_rate_id: '',
        delivery_method_id: '',
        note: '',
        items: [{ product_id: '', price_type_id: '', price: 0, quantity_ordered: 1 }]
      });
      
      setItems([{ id: uuidv4(), product_id: '', price_type_id: '', price: 0, quantity_ordered: 1 }]);  // Reset items
      priceUpdatedRef.current = false;  // Allow fresh price fetch next time
    })();
  
  // Only show the submit button if the category is 'sales'
  if (category !== 'sales') {
    return <CustomTypography variant="h6">This form is only available for 'sales' category.</CustomTypography>;
  }
  
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
                <Suspense fallback={<Loading message="Loading date picker..." />}>
                  <CustomDatePicker
                    label="Order Date"
                    value={field.value || null}
                    onChange={(date) => field.onChange(date)}
                  />
                </Suspense>
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
                <BaseInput
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
        
        <CustomTypography variant="h6" gutterBottom>Shipping Information</CustomTypography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Controller
              name="has_shipping_info"
              control={control}
              render={({ field }) => (
                <BaseInput
                  label="Include Shipping Info?"
                  select
                  fullWidth
                  value={field.value ? 'yes' : 'no'}
                  onChange={(e) => field.onChange(e.target.value === 'yes')}
                  slotProps={{
                    select: {
                      native: true,
                    },
                  }}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </BaseInput>
              )}
            />
          </Grid>
          
          {methods.watch('has_shipping_info') && (
            <>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="shipping_info.shipping_fullname"
                  control={control}
                  render={({ field }) => (
                    <BaseInput label="Recipient Name" {...field} fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="shipping_info.shipping_phone"
                  control={control}
                  render={({ field }) => (
                    <BaseInput label="Phone Number" {...field} fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="shipping_info.shipping_email"
                  control={control}
                  render={({ field }) => (
                    <BaseInput label="Email" {...field} fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="shipping_info.shipping_address_line1"
                  control={control}
                  render={({ field }) => (
                    <BaseInput label="Address Line 1" {...field} fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="shipping_info.shipping_address_line2"
                  control={control}
                  render={({ field }) => (
                    <BaseInput label="Address Line 2 (Optional)" {...field} fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="shipping_info.shipping_city"
                  control={control}
                  render={({ field }) => (
                    <BaseInput label="City" {...field} fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="shipping_info.shipping_state"
                  control={control}
                  render={({ field }) => (
                    <BaseInput label="State / Province" {...field} fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="shipping_info.shipping_postal_code"
                  control={control}
                  render={({ field }) => (
                    <BaseInput label="Postal Code" {...field} fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="shipping_info.shipping_country"
                  control={control}
                  render={({ field }) => (
                    <BaseInput label="Country" {...field} fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="shipping_info.shipping_region"
                  control={control}
                  render={({ field }) => (
                    <BaseInput label="Region" {...field} fullWidth />
                  )}
                />
              </Grid>
            </>
          )}
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <CustomTypography variant="h6" gutterBottom>
        Order Items
        </CustomTypography>
        
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
                          fetchPriceByProductAndPriceType(val, item.price_type_id, item.id);
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
                        productId={item.product_id}
                        onChange={(val) => {
                          field.onChange(val); // Update react-hook-form state
                          handleItemChange(item.id, 'price_type_id', val); // Update local state
                          
                          // Trigger fetching of price if both product_id and price_type_id are present
                          if (item.product_id) {
                            fetchPriceByProductAndPriceType(item.product_id, val, item.id);
                          }
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
                          const value = parseFloat(e.target.value) || 0;
                          field.onChange(value);
                          handleItemChange(item.id, 'price', value);
                        }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">$</InputAdornment>
                            ),
                          },
                        }}
                        disabled={priceValueLoading}
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
                
                {/* Display Subtotal (Read-Only) */}
                <Grid size={{ xs: 6, md: 8 }}>
                  <CustomTypography variant="subtitle1" sx={{ mt: 1 }}>
                    Subtotal: ${ (item.price * item.quantity_ordered).toFixed(2) }
                  </CustomTypography>
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
