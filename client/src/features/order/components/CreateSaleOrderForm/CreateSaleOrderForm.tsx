import { type FC, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import {
  type CustomFormRef,
} from '@components/common/CustomForm';
import {
  type MultiItemFormRef,
} from '@components/common/MultiItemForm';
import CustomButton from '@components/common/CustomButton';
import usePermissions from '@hooks/usePermissions';
import useHasPermission from '@features/authorize/hooks/useHasPermission';
import { PERMISSIONS } from '@utils/constants/orderPermissions';
import useSalesOrderCreate from '@hooks/useSalesOrderCreate';
import type { CreateSalesOrderForm, CreateSalesOrderInput } from '@features/order/state';
import useSalesOrderLookups from '@features/order/hooks/useSalesOrderLookups';
import type {
  AddressByCustomerLookup,
  CustomerLookupQuery,
  DeliveryMethodLookupQueryParams,
  DiscountLookupQueryParams, PackagingMaterialLookupQueryParams,
  PaymentMethodLookupQueryParams,
  PricingLookupQueryParams,
  SkuLookupQueryParams,
  TaxRateLookupQueryParams,
} from '@features/lookup/state';
import Alert from '@mui/material/Alert';
import {
  OrderDetailsSection,
  OrderItemSection
} from '@features/order/components/CreateSaleOrderForm/index';
import useSalesOrderSubmission from '@features/order/hooks/useSalesOrderSubmission';
import useAllSalesOrderSearchHandlers from '@features/order/hooks/useAllSalesOrderSearchHandlers';
import useSkuPricingEffects from '@features/order/hooks/useSkuPricingEffects';
import { createDropdownBundle, fetchLookups, resetLookups } from '@utils/lookupHelpers';

/**
 * Form component for creating a sales order.
 *
 * Combines customer, payment, tax, delivery, and item selection into a unified flow.
 * Handles permission validation, paginated dropdowns, debounced searches, dynamic field display,
 * and submission payload formatting.
 */
const CreateSaleOrderForm: FC = () => {
  const navigate = useNavigate();
  const { category } = useParams();
  
  const { loading, permissions } = usePermissions();
  const hasPermission = useHasPermission(permissions);
  
  // Memoize permission checks
  const canCreateSalesOrder = useMemo(
    () => hasPermission([PERMISSIONS.CREATE_SALES_ORDER]),
    [hasPermission]
  );
  
  // Server-backed lookup bundles
  const {
    orderType,
    customer,
    customerAddresses,
    paymentMethod,
    discount,
    taxRate,
    deliveryMethod,
    sku,
    pricing,
    packagingMaterial,
  } = useSalesOrderLookups();
  
  // Sales Order create
  const {
    loading: submitting,
    error: orderError,
    orderId,
    handleSubmitSalesOrder,
    resetState: resetSalesOrderState,
  } = useSalesOrderCreate();
  
  const {
    handleOrderTypeSearch,
    handleCustomerSearch,
    handlePaymentSearch,
    handleDiscountSearch,
    handleTaxRateSearch,
    handleDeliveryMethodSearch,
    handleSkuSearch,
    handlePricingSearch,
    handlePackagingMaterialSearch,
  } = useAllSalesOrderSearchHandlers(
    {
      orderType,
      customer,
      paymentMethod,
      discount,
      taxRate,
      deliveryMethod,
      sku,
      pricing,
      packagingMaterial,
    },
    category
  );
  
  // Main form
  const form = useForm<CreateSalesOrderForm>({
    mode: 'onChange',
    defaultValues: {
      order_date: new Date().toISOString(),
      billing_same_as_shipping: false,
      currency_code: 'CAD',
    },
  });
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showBarcode, setShowBarcode] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, any>[]>([]);
  
  // Dropdown state bundles
  const customerDropdown = createDropdownBundle<CustomerLookupQuery>();
  const paymentMethodDropdown = createDropdownBundle<PaymentMethodLookupQueryParams>();
  const discountDropdown = createDropdownBundle<DiscountLookupQueryParams>();
  const taxRateDropdown = createDropdownBundle<TaxRateLookupQueryParams>();
  const deliveryMethodDropdown = createDropdownBundle<DeliveryMethodLookupQueryParams>();
  
  const skuDropdown = createDropdownBundle<SkuLookupQueryParams>({ includeBarcode: true });
  const pricingDropdown = createDropdownBundle<PricingLookupQueryParams>({
    skuId: selectedSkuId ?? null,
    labelOnly: false,
  });
  // packaging dropdown state (default to salesDropdown mode so server enforces visible-only/active/unarchived)
  const packagingMaterialDropdown = createDropdownBundle<PackagingMaterialLookupQueryParams>({
    mode: 'salesDropdown',
  });
  
  // Initial fetch + cleanup
  useEffect(() => {
    if (category) {
      orderType.fetch({ keyword: '', category });
    }
    
    fetchLookups([
      { fetch: customer.fetch,          dropdown: customerDropdown },
      { fetch: paymentMethod.fetch,     dropdown: paymentMethodDropdown },
      { fetch: discount.fetch,          dropdown: discountDropdown },
      { fetch: taxRate.fetch,           dropdown: taxRateDropdown },
      { fetch: deliveryMethod.fetch,    dropdown: deliveryMethodDropdown },
      { fetch: sku.fetch,               dropdown: skuDropdown },
      { fetch: pricing.fetch,           dropdown: pricingDropdown },
      { fetch: packagingMaterial.fetch, dropdown: packagingMaterialDropdown },
    ]);
    
    return () => {
      resetLookups([
        { reset: orderType.reset },
        { reset: customer.reset },
        { reset: paymentMethod.reset },
        { reset: discount.reset },
        { reset: taxRate.reset },
        { reset: deliveryMethod.reset },
        { reset: sku.reset },
        { reset: pricing.reset },
        { reset: packagingMaterial.reset },
      ]);
      resetSalesOrderState();
    };
  }, [category]);
  
  // Addresses on customer change
  useEffect(() => {
    if (selectedCustomerId) {
      customerAddresses.fetch(selectedCustomerId);
    } else {
      customerAddresses.reset();
    }
  }, [selectedCustomerId]);
  
  useEffect(() => {
    if (!loading && !canCreateSalesOrder) {
      navigate('/access-denied', { replace: true });
    }
  }, [canCreateSalesOrder, navigate]);
  
  useSkuPricingEffects({
    showBarcode,
    selectedSkuId,
    
    skuFetchParams: skuDropdown.fetchParams,
    setSkuFetchParams: skuDropdown.setFetchParams,
    fetchSku: sku.fetch,
    
    pricingFetchParams: pricingDropdown.fetchParams,
    setPricingFetchParams: pricingDropdown.setFetchParams,
    fetchPricing: pricing.fetch,
    setPricingInputValue: (value: string) =>
      pricingDropdown.setDropdownState((prev) => ({
        ...prev,
        inputValue: value,
      })),
  });
  
  const refreshOrderTypes = useCallback(() => {
    orderType.fetch({ keyword: '', category });
  }, [orderType, category]);
  
  const formatFullAddress = (address: AddressByCustomerLookup) =>
    `${address.label} - ${address.formatted_address} (${address.recipient_name})`;
  
  const addressOptions = customerAddresses.options.map((address: AddressByCustomerLookup) => ({
    value: address.id,
    label: formatFullAddress(address),
  }));
  
  const isRowBlank = (row: Record<string, any>) => {
    const t = (row.line_type ?? 'sku') as 'sku' | 'packaging_material';
    const hasId = t === 'sku' ? !!row.sku_id : !!row.packaging_material_id;
    const hasQty = Number(row.quantity_ordered) > 0;
    const hasManual = !!row.override_price && row.price !== '' && row.price != null && !Number.isNaN(Number(row.price));
    const hasPriceId = !!row.price_id;
    return !hasId && !hasQty && !hasManual && !hasPriceId;
  };
  
  const effectiveItems = items.filter(r => !isRowBlank(r));
  
  const isValidItem = (row: Record<string, any>) => {
    const type = (row.line_type ?? 'sku') as 'sku' | 'packaging_material';
    const qtyOk = Number(row.quantity_ordered) > 0;

    if (type === 'sku') {
      const hasSku = !!row.sku_id;
      const override = !!row.override_price;
      const manualOk = override && row.price !== '' && row.price != null && !Number.isNaN(Number(row.price));
      const priceIdOk = !override && !!row.price_id;
      return hasSku && qtyOk && (manualOk || priceIdOk);
    }

    // packaging: require id + qty; manual price only if override=true
    const hasPkg = !!row.packaging_material_id;
    const override = !!row.override_price;
    const manualOk = !override || (row.price !== '' && row.price != null && !Number.isNaN(Number(row.price)));
    return hasPkg && qtyOk && manualOk;
  };
  
  const itemsOk = effectiveItems.length > 0 && effectiveItems.every(isValidItem);
  
  const hasValidSkuLine = effectiveItems.some(
    (r) => ((r.line_type ?? 'sku') === 'sku') && isValidItem(r)
  );
  
  const w = useWatch({ control: form.control });
  const headerFlags = {
    order_type_id: !!w.order_type_id,
    order_date: !!w.order_date,
    customer_id: !!w.customer_id,
    payment_method_id: !!w.payment_method_id,
    tax_rate_id: !!w.tax_rate_id,
    delivery_method_id: !!w.delivery_method_id,
    shipping_address_id: !!w.shipping_address_id,
    billing_ok: w.billing_same_as_shipping ? true : !!w.billing_address_id,
    exchange_ok: w.currency_code === 'CAD' ? true : !!w.exchange_rate,
  };
  const headerOk = Object.values(headerFlags).every(Boolean);
  const canSubmit = headerOk && itemsOk && hasValidSkuLine && !submitting;
  
  const formRef = useRef<CustomFormRef<CreateSalesOrderInput>>(null);
  const itemFormRef = useRef<MultiItemFormRef>(null);
  
  const { handleFullSubmit } = useSalesOrderSubmission({
    form,
    itemFormRef,
    handleSubmitSalesOrder,
  });
  
  return (
    <Box>
      {orderError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof orderError === 'string' ? orderError : 'Something went wrong.'}
        </Alert>
      )}
      
      {orderId && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Order created successfully! ID: {orderId}
        </Alert>
      )}
      
      <OrderDetailsSection
        formInstance={form}
        formRef={formRef}
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        addressOptions={addressOptions}
        
        // Lookup bundles
        orderType={orderType}
        customer={customer}
        paymentMethod={paymentMethod}
        discount={discount}
        taxRate={taxRate}
        deliveryMethod={deliveryMethod}
        
        // Paginated dropdowns
        customerDropdown={customerDropdown}
        paymentMethodDropdown={paymentMethodDropdown}
        discountDropdown={discountDropdown}
        taxRateDropdown={taxRateDropdown}
        deliveryMethodDropdown={deliveryMethodDropdown}
        
        // Search handlers
        handleOrderTypeSearch={handleOrderTypeSearch}
        handleCustomerSearch={handleCustomerSearch}
        handlePaymentSearch={handlePaymentSearch}
        handleDiscountSearch={handleDiscountSearch}
        handleTaxRateSearch={handleTaxRateSearch}
        handleDeliveryMethodSearch={handleDeliveryMethodSearch}
        refreshOrderTypes={refreshOrderTypes}
      />
      
      <OrderItemSection
        formRef={itemFormRef}
        onItemsChange={setItems}
        // Lookup bundles
        sku={sku}
        pricing={pricing}
        packagingMaterial={packagingMaterial}
        // Dropdown states
        skuDropdown={skuDropdown}
        pricingDropdown={pricingDropdown}
        packagingMaterialDropdown={packagingMaterialDropdown}
        // Search handlers
        handleSkuSearch={handleSkuSearch}
        handlePricingSearch={handlePricingSearch}
        handlePackagingMaterialSearch={handlePackagingMaterialSearch}
        // Selected ids
        setSelectedSkuId={setSelectedSkuId}
        // UI flags
        showBarcode={showBarcode}
        setShowBarcode={setShowBarcode}
      />
      
      <CustomButton onClick={handleFullSubmit} loading={submitting} disabled={!canSubmit}>
        Submit Order
      </CustomButton>
      {!hasValidSkuLine && (
        <Alert severity="info" sx={{ mb: 2 }}>
          At least one SKU item is required; packaging-only orders aren’t allowed.
        </Alert>
      )}
    </Box>
  );
};

export default CreateSaleOrderForm;
