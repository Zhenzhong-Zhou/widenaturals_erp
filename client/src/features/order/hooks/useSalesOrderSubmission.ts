import { type RefObject, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { MultiItemFormRef } from '@components/common/MultiItemForm';
import type { CreateSalesOrderForm, CreateSalesOrderInput, OrderItemInput } from '@features/order/state';

interface UseSalesOrderSubmissionParams {
  form: UseFormReturn<CreateSalesOrderForm>;
  itemFormRef: RefObject<MultiItemFormRef | null>;
  handleSubmitSalesOrder: (orderType: string, payload: CreateSalesOrderInput) => Promise<void>;
}

/**
 * Returns a memoized `handleFullSubmit` function to process and submit the full sales order form.
 */
const useSalesOrderSubmission = ({
                                          form,
                                          itemFormRef,
                                          handleSubmitSalesOrder,
                                        }: UseSalesOrderSubmissionParams) => {
  const handleFullSubmit = useCallback(async () => {
    const rawFormValues = form.getValues();
    const rawItems = itemFormRef.current?.getItems() || [];
    
    const {
      billing_same_as_shipping,
      address_section_label,
      address_placeholder,
      ...formValues
    } = rawFormValues;
    
    const cleanedItems: OrderItemInput[] = rawItems.map((item): OrderItemInput => {
      const {
        sku_id,
        packaging_material_id,
        price_id,
        quantity_ordered,
        price,
      } = item;
      
      return {
        sku_id,
        packaging_material_id: packaging_material_id || undefined,
        price_id,
        quantity_ordered: Number(quantity_ordered),
        price: Number(price),
      };
    });
    
    const exchange_rate =
      formValues.currency_code === 'CAD' || !formValues.exchange_rate
        ? 1
        : Number(formValues.exchange_rate);
    
    const order_date = new Date(formValues.order_date || Date.now()).toISOString();
    
    if (formValues.discount_id === '') {
      delete formValues.discount_id;
    }
    
    const shipping_fee =
      String(formValues.shipping_fee).trim() === '' ? 0 : Number(formValues.shipping_fee);
    
    const payload: CreateSalesOrderInput = {
      ...formValues,
      order_date,
      exchange_rate,
      billing_address_id: billing_same_as_shipping
        ? formValues.shipping_address_id
        : formValues.billing_address_id,
      shipping_fee,
      order_items: cleanedItems,
    };
    
    await handleSubmitSalesOrder('sales', payload);
  }, [form, itemFormRef, handleSubmitSalesOrder]);
  
  return { handleFullSubmit };
};

export default useSalesOrderSubmission;
