import { type RefObject, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { MultiItemFormRef } from '@components/common/MultiItemForm';
import type { CreateSalesOrderForm, CreateSalesOrderInput, OrderItemInput } from '@features/order/state';

interface UseSalesOrderSubmissionParams {
  form: UseFormReturn<CreateSalesOrderForm>;
  itemFormRef: RefObject<MultiItemFormRef | null>;
  handleSubmitSalesOrder: (orderType: string, payload: CreateSalesOrderInput) => Promise<void>;
}

// tiny helpers
const toNumberOrUndefined = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const stripUndefined = <T extends Record<string, any>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

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
    
    const cleanedItems: OrderItemInput[] = rawItems
      // drop rows with neither sku nor packaging selected
      .filter((it) => it?.sku_id || it?.packaging_material_id)
      .map((it) => {
        const lineType: 'sku' | 'packaging_material' =
          it.line_type === 'packaging_material' || it.packaging_material_id ? 'packaging_material' : 'sku';

        const quantity_ordered = toNumberOrUndefined(it.quantity_ordered) ?? 0;
        const override = !!it.override_price;

        if (lineType === 'packaging_material') {
          // Packaging line: no price_id; price is 0 unless overridden
          const item: Partial<OrderItemInput> = {
            packaging_material_id: it.packaging_material_id || undefined,
            quantity_ordered,
            price: override ? (toNumberOrUndefined(it.price) ?? 0) : 0,
          };
          return stripUndefined(item as OrderItemInput);
        } else {
          // SKU line
          const item: Partial<OrderItemInput> = {
            sku_id: it.sku_id || undefined,
            quantity_ordered,
            price_id: it.price_id || undefined,
            // If overridden, send price; else rely on price_id
            price: override ? toNumberOrUndefined(it.price) : undefined,
          };
          return stripUndefined(item as OrderItemInput);
        }
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
      String(formValues.shipping_fee ?? '').trim() === '' ? 0 : Number(formValues.shipping_fee);
    
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
