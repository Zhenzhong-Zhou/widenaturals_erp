import { type FC, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
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
  DiscountLookupQueryParams,
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
  
  // Lookup bundles for dropdowns (uses Redux or query hooks internally)
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
  } = useSalesOrderLookups();
  
  // Sales Order Creates
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
    },
    category
  );
  
  // Initialize main form instance for order-level fields
  const form = useForm<CreateSalesOrderForm>({
    defaultValues: {
      billing_same_as_shipping: false,
      currency_code: 'CAD',
    },
  });
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [showBarcode, setShowBarcode] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  
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
  
  // Initial fetch and cleanup
  useEffect(() => {
    if (category) {
      orderType.fetch({ keyword: '', category });
    }
    
    fetchLookups([
      { fetch: customer.fetch, dropdown: customerDropdown },
      { fetch: paymentMethod.fetch, dropdown: paymentMethodDropdown },
      { fetch: discount.fetch, dropdown: discountDropdown },
      { fetch: taxRate.fetch, dropdown: taxRateDropdown },
      { fetch: deliveryMethod.fetch, dropdown: deliveryMethodDropdown },
      { fetch: sku.fetch, dropdown: skuDropdown },
      { fetch: pricing.fetch, dropdown: pricingDropdown },
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
      ]);
      resetSalesOrderState();
    };
  }, [category]);
  
  
  // Watch for customer_id changes and fetch addresses accordingly
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
        sku={sku}
        pricing={pricing}
        
        skuDropdown={skuDropdown}
        pricingDropdown={pricingDropdown}
        
        handleSkuSearch={handleSkuSearch}
        handlePricingSearch={handlePricingSearch}
        
        setSelectedSkuId={setSelectedSkuId}
        
        showBarcode={showBarcode}
        setShowBarcode={setShowBarcode}
      />
      
      <CustomButton onClick={handleFullSubmit} loading={submitting}>
        Submit Order
      </CustomButton>
    </Box>
  );
};

export default CreateSaleOrderForm;
