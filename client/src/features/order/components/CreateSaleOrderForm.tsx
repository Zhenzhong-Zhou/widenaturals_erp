import { type FC, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CustomForm, {
  type CustomFormRef,
  type CustomRenderParams,
  type FieldConfig,
} from '@components/common/CustomForm';
import MultiItemForm, {
  type MultiItemFieldConfig,
  type MultiItemFormRef,
  type RowAwareComponentProps,
} from '@components/common/MultiItemForm';
import CustomButton from '@components/common/CustomButton';
import OrderTypeDropdown from '@features/lookup/components/OrderTypesDropdown';
import usePermissions from '@hooks/usePermissions';
import useHasPermission from '@features/authorize/hooks/useHasPermission';
import { PERMISSIONS } from '@utils/constants/orderPermissions';
import useSalesOrderCreate from '@hooks/useSalesOrderCreate';
import type { CreateSalesOrderForm, CreateSalesOrderInput, OrderItemInput } from '@features/order/state';
import useSalesOrderLookups from '@features/order/hooks/useSalesOrderLookups';
import type {
  AddressByCustomerLookup,
  CustomerLookupQuery,
  DeliveryMethodLookupQueryParams,
  DiscountLookupQueryParams,
  LookupOption,
  PaymentMethodLookupQueryParams,
  PricingLookupQueryParams,
  SkuLookupQueryParams,
  TaxRateLookupQueryParams,
} from '@features/lookup/state';
import useDebouncedSearch from '@utils/hooks/useDebouncedSearch';
import { transformLookupOptions } from '@utils/lookupTransformers';
import CustomDatePicker from '@components/common/CustomDatePicker';
import CustomerDropdown from '@features/lookup/components/CustomerDropdown';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CustomTypography from '@components/common/CustomTypography';
import PaymentMethodDropdown from '@features/lookup/components/PaymentMethodDropdown';
import { extractPaginatedHandlers, getDefaultPaginatedDropdownState } from '@utils/lookupHelpers';
import DiscountDropdown from '@features/lookup/components/DiscountDropdown';
import TaxRateDropdown from '@features/lookup/components/TaxRateDropdown';
import DeliveryMethodDropdown from '@features/lookup/components/DeliveryMethodDropdown';
import currencyCodes from 'currency-codes';
import Dropdown from '@components/common/Dropdown.tsx';
import BaseInput from '@components/common/BaseInput.tsx';
import SkuDropdown from '@features/lookup/components/SkuDropdown.tsx';
import Switch from '@mui/material/Switch';
import PricingDropdown from '@features/lookup/components/PricingDropdown';
import Alert from '@mui/material/Alert';
import PriceField from './PriceField';

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

  // RHF instance for watching customer_id
  const form = useForm<CreateSalesOrderForm>({
    defaultValues: {
      billing_same_as_shipping: false,
      currency_code: 'CAD',
    },
  });
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  
  const [customerDropdownState, setCustomerDropdownState] = useState(
    getDefaultPaginatedDropdownState<CustomerLookupQuery>()
  );
  
  const { fetchParams: customerFetchParams, setFetchParams: setCustomerFetchParams } =
    extractPaginatedHandlers<
      CustomerLookupQuery,
      {
        inputValue: string;
        fetchParams: CustomerLookupQuery;
      }
    >(customerDropdownState, setCustomerDropdownState);
  
  const [paymentMethodDropdownState, setPaymentMethodDropdownState] = useState(
    getDefaultPaginatedDropdownState<PaymentMethodLookupQueryParams>()
  );
  
  const {
    fetchParams: paymentFetchParams,
    setFetchParams: setPaymentFetchParams,
  } = extractPaginatedHandlers<
    PaymentMethodLookupQueryParams,
    {
      inputValue: string;
      fetchParams: PaymentMethodLookupQueryParams;
    }
  >(paymentMethodDropdownState, setPaymentMethodDropdownState);
  
  const [discountDropdownState, setDiscountDropdownState] = useState(
    getDefaultPaginatedDropdownState<DiscountLookupQueryParams>()
  );
  
  const {
    fetchParams: discountFetchParams,
    setFetchParams: setDiscountFetchParams,
  } = extractPaginatedHandlers<
    DiscountLookupQueryParams,
    {
      inputValue: string;
      fetchParams: DiscountLookupQueryParams;
    }
  >(discountDropdownState, setDiscountDropdownState);

  // Tax Rate Dropdown State
  const [taxRateDropdownState, setTaxRateDropdownState] = useState(
    getDefaultPaginatedDropdownState<TaxRateLookupQueryParams>()
  );
  
  const {
    fetchParams: taxRateFetchParams,
    setFetchParams: setTaxRateFetchParams,
  } = extractPaginatedHandlers<
    TaxRateLookupQueryParams,
    {
      inputValue: string;
      fetchParams: TaxRateLookupQueryParams;
    }
  >(taxRateDropdownState, setTaxRateDropdownState);

  // Delivery Method Dropdown State
  const [deliveryMethodDropdownState, setDeliveryMethodDropdownState] = useState(
    getDefaultPaginatedDropdownState<DeliveryMethodLookupQueryParams>()
  );
  
  const {
    fetchParams: deliveryMethodFetchParams,
    setFetchParams: setDeliveryMethodFetchParams,
  } = extractPaginatedHandlers<
    DeliveryMethodLookupQueryParams,
    {
      inputValue: string;
      fetchParams: DeliveryMethodLookupQueryParams;
    }
  >(deliveryMethodDropdownState, setDeliveryMethodDropdownState);
  
  const billingSameAsShipping = useWatch({
    control: form.control,
    name: 'billing_same_as_shipping',
  });
  
  const [showBarcode, setShowBarcode] = useState(false);
  
  const [skuDropdownState, setSkuDropdownState] = useState(
    getDefaultPaginatedDropdownState<SkuLookupQueryParams>({
      includeBarcode: showBarcode ?? false,
    })
  );
  
  const {
    fetchParams: skuFetchParams,
    setFetchParams: setSkuFetchParams,
  } = extractPaginatedHandlers<
    SkuLookupQueryParams,
    {
      inputValue: string;
      fetchParams: SkuLookupQueryParams;
    }
  >(skuDropdownState, setSkuDropdownState);
  
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  
  const [pricingDropdownState, setPricingDropdownState] = useState(
    getDefaultPaginatedDropdownState<PricingLookupQueryParams>({
      skuId: selectedSkuId ?? null,
      labelOnly: false,
    })
  );
  
  const {
    fetchParams: pricingFetchParams,
    setFetchParams: setPricingFetchParams,
  } = extractPaginatedHandlers<
    PricingLookupQueryParams,
    {
      inputValue: string;
      fetchParams: PricingLookupQueryParams;
    }
  >(pricingDropdownState, setPricingDropdownState);
  
  // Initial fetch and cleanup
  useEffect(() => {
    if (category) {
      orderType.fetch({ keyword: '', category });
    }

    customer.fetch(customerFetchParams);
    paymentMethod.fetch(paymentFetchParams);
    discount.fetch(discountFetchParams);
    taxRate.fetch(taxRateFetchParams);
    deliveryMethod.fetch(deliveryMethodFetchParams);
    sku.fetch(skuFetchParams);
    pricing.fetch(pricingFetchParams);

    return () => {
      orderType.reset();
      customer.reset();
      paymentMethod.reset();
      discount.reset();
      taxRate.reset();
      deliveryMethod.reset();
      sku.reset();
      pricing.reset();
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
  
  // Sync when toggle changes
  useEffect(() => {
    setSkuDropdownState((prev) => ({
      ...prev,
      fetchParams: {
        ...prev.fetchParams,
        includeBarcode: showBarcode,
      },
    }));
    
    sku.fetch({
      ...skuDropdownState.fetchParams,
      includeBarcode: showBarcode,
    });
  }, [showBarcode]);
  
  useEffect(() => {
    if (selectedSkuId) {
      const nextParams = {
        ...pricingFetchParams,
        skuId: selectedSkuId,
        offset: 0, // always reset pagination when SKU changes
      };
      
      // Update both state and fetch with the same param object
      setPricingFetchParams(nextParams);
      pricing.fetch(nextParams);
    }
  }, [selectedSkuId]);
  
  useEffect(() => {
    if (selectedSkuId) {
      setPricingDropdownState((prev) => ({
        ...prev,
        inputValue: '',
      }));
    }
  }, [selectedSkuId]);
  
  const handleSearch = useDebouncedSearch(orderType.fetch, { category });
  
  const handleCustomerSearch = useDebouncedSearch<CustomerLookupQuery>(
    customer.fetch,
  );
  
  const handlePaymentSearch = useDebouncedSearch<PaymentMethodLookupQueryParams>(
    paymentMethod.fetch,
  );
  
  const handleDiscountSearch = useDebouncedSearch<DiscountLookupQueryParams>(
    discount.fetch,
  );
  
  const handleTaxRateSearch = useDebouncedSearch
    <TaxRateLookupQueryParams>(
      taxRate.fetch
    );
  
  const handleDeliveryMethodSearch = useDebouncedSearch
    <DeliveryMethodLookupQueryParams>(
    deliveryMethod.fetch
    );
  
  const handleSkuSearch = useDebouncedSearch<SkuLookupQueryParams>(
    sku.fetch
  );
  
  const handlePricingSearch = useDebouncedSearch<PricingLookupQueryParams>(
    pricing.fetch
  );
  
  const refreshOrderTypes = useCallback(() => {
    orderType.fetch({ keyword: '', category });
  }, [orderType, category]);
  
  const formattedOrderTypes = useMemo(
    () =>
      transformLookupOptions(orderType.options ?? [], {
        preserveHyphen: true,
      }),
    [orderType.options]
  );
  
  const formatFullAddress = (address: AddressByCustomerLookup) =>
    `${address.label} - ${address.formatted_address} (${address.recipient_name})`;
  
  const addressOptions = customerAddresses.options.map((address: AddressByCustomerLookup) => ({
    value: address.id,
    label: formatFullAddress(address),
  }));
  
  const currencyOptions = currencyCodes.codes().reduce((acc, code) => {
    const currency = currencyCodes.code(code);
    if (currency) {
      acc.push({
        value: currency.code,
        label: `${currency.code} - ${currency.currency}`,
      });
    }
    return acc;
  }, [] as LookupOption[]);
  
  // Order Form Fields
  const orderFields: FieldConfig[] = [
    {
      id: 'order_type_id',
      type: 'custom',
      label: 'Order Type',
      required: true,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
          <OrderTypeDropdown
            value={value ?? ''}
            onChange={(id) => {
              if (id !== value) {
                onChange(id);
              }
            }}
            orderTypeOptions={formattedOrderTypes}
            orderTypeLoading={orderType.loading}
            orderTypeError={orderType.error}
            onKeywordSearch={handleSearch}
            onRefresh={refreshOrderTypes}
            disabled={orderType.loading}
            helperText={required ? 'Required' : ''}
          />
        ) : null,
    },
    {
      id: 'order_date',
      type: 'custom',
      label: 'Order Date (ISO)',
      required: true,
      customRender: ({ value, onChange }: CustomRenderParams) =>
        onChange ? (
          <CustomDatePicker
            label="Order Date"
            value={value || new Date()}
            onChange={onChange}
            required
          />
        ) : null
    },
    {
      id: 'customer_id',
      type: 'custom',
      label: 'Customer',
      required: true,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
          <CustomerDropdown
            value={value ?? ''}
            onChange={(id) => {
              onChange?.(id);
              setSelectedCustomerId(id);
              
              const matchedOption = customer.options.find(opt => opt.value === id);
              
              setCustomerDropdownState((prev) => ({
                ...prev,
                inputValue: matchedOption?.label ?? '',
              }));
            }}
            inputValue={customerDropdownState.inputValue}
            onInputChange={(_e, newValue, reason) => {
              if (reason !== 'input') return;
              
              const updatedParams = {
                ...customerFetchParams,
                keyword: newValue,
                offset: 0,
              };
              
              setCustomerDropdownState((prev) => ({
                ...prev,
                inputValue: newValue,
                fetchParams: updatedParams,
              }));
              
              handleCustomerSearch(newValue);
            }}
            options={customer.options}
            loading={customer.loading}
            error={customer.error}
            paginationMeta={customer.meta}
            fetchParams={customerFetchParams}
            setFetchParams={setCustomerFetchParams}
            onRefresh={(params) => customer.fetch(params)}
            helperText={required ? 'Required' : ''}
          />
        ) : null,
    },
    {
      id: 'address_section_label',
      type: 'custom',
      customRender: () => (
        <CustomTypography variant="subtitle2" sx={{ mt: 2 }}>
          Shipping & Billing Address
        </CustomTypography>
      ),
    },
    ...(selectedCustomerId
      ? [
        {
          id: 'shipping_address_id',
          type: 'select',
          label: 'Shipping Address',
          required: true,
          options: addressOptions,
        },
        {
          id: 'billing_same_as_shipping',
          type: 'checkbox',
          label: 'Same as shipping address',
          defaultValue: true,
          customRender: ({ value, onChange }: CustomRenderParams) =>
            onChange ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                  />
                }
                label="Billing address is the same as shipping"
              />
            ) : null,
        },
        !billingSameAsShipping
          ? {
            id: 'billing_address_id',
            type: 'select',
            label: 'Billing Address',
            required: true,
            options: addressOptions,
          }
          : null,
      ].filter(Boolean)
      : [
        {
          id: 'address_placeholder',
          type: 'custom',
          customRender: () => (
            <CustomTypography
              key="address-placeholder"
              variant="body2"
              sx={{ color: 'text.secondary', mt: 1 }}
            >
              Please select a customer to enter shipping and billing addresses.
            </CustomTypography>
          ),
        },
      ]),
    {
      id: 'payment_method_id',
      type: 'custom',
      label: 'Payment Method',
      required: true,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange  ? (
          <PaymentMethodDropdown
            value={value ?? ''}
            onChange={(id) => {
              onChange?.(id);
            }}
            inputValue={paymentMethodDropdownState.inputValue}
            fetchParams={paymentFetchParams}
            setFetchParams={setPaymentFetchParams}
            onInputChange={(_e, newValue) => {
              setPaymentMethodDropdownState((prev) => ({
                ...prev,
                inputValue: newValue,
                fetchParams: {
                  ...prev.fetchParams,
                  keyword: newValue,
                  offset: 0,
                },
              }));
              
              handlePaymentSearch(newValue);
            }}
            options={paymentMethod.options}
            loading={paymentMethod.loading}
            error={paymentMethod.error}
            paginationMeta={paymentMethod.meta}
            onRefresh={(params) => paymentMethod.fetch(params)}
            helperText={required ? 'Required' : ''}
          />
        ) : null,
    },
    {
      id: 'discount_id',
      type: 'custom',
      label: 'Discount (Optional)',
      required: false,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
          <DiscountDropdown
            value={value ?? ''}
            onChange={(id) => {
              onChange?.(id);
            }}
            inputValue={discountDropdownState.inputValue}
            fetchParams={discountFetchParams}
            setFetchParams={setDiscountFetchParams}
            onInputChange={(_e, newValue) => {
              setDiscountDropdownState((prev) => ({
                ...prev,
                inputValue: newValue,
                fetchParams: {
                  ...prev.fetchParams,
                  keyword: newValue,
                  offset: 0,
                },
              }));
              
              handleDiscountSearch(newValue);
            }}
            options={discount.options}
            loading={discount.loading}
            error={discount.error}
            paginationMeta={discount.meta}
            onRefresh={(params) => discount.fetch(params)}
            helperText={required ? 'Required' : ''}
          />
        ) : null,
    },
    {
      id: 'tax_rate_id',
      type: 'custom',
      label: 'Tax Rate',
      required: true,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
          <TaxRateDropdown
            value={value ?? ''}
            onChange={(id) => {
              onChange?.(id);
              
              const matchedOption = taxRate.options.find(opt => opt.value === id);
              
              setTaxRateDropdownState((prev) => ({
                ...prev,
                inputValue: matchedOption?.label ?? '', // Ensure label shown, not UUID
              }));
            }}
            inputValue={taxRateDropdownState.inputValue}
            fetchParams={taxRateFetchParams}
            setFetchParams={setTaxRateFetchParams}
            onInputChange={(_e, newValue, reason) => {
              if (reason !== 'input') return;
              
              const updatedParams = {
                ...taxRateFetchParams,
                keyword: newValue,
                offset: 0,
              };
              
              setTaxRateDropdownState((prev) => ({
                ...prev,
                inputValue: newValue,
                fetchParams: updatedParams,
              }));
              
              handleTaxRateSearch(newValue); // Only trigger on typing, not on select
            }}
            options={taxRate.options}
            loading={taxRate.loading}
            error={taxRate.error}
            paginationMeta={taxRate.meta}
            onRefresh={(params) => taxRate.fetch(params)}
            helperText={required ? 'Required' : ''}
          />
        ) : null,
    },
    {
      id: 'delivery_method_id',
      type: 'custom',
      label: 'Delivery Method',
      required: true,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
          <DeliveryMethodDropdown
            value={value ?? ''}
            onChange={(id) => {
              onChange?.(id);
            }}
            inputValue={deliveryMethodDropdownState.inputValue}
            fetchParams={deliveryMethodFetchParams}
            setFetchParams={setDeliveryMethodFetchParams}
            onInputChange={(_e, newValue) => {
              setDeliveryMethodDropdownState((prev) => ({
                ...prev,
                inputValue: newValue,
                fetchParams: {
                  ...prev.fetchParams,
                  keyword: newValue,
                  offset: 0,
                },
              }));
              
              handleDeliveryMethodSearch(newValue);
            }}
            options={deliveryMethod.options}
            loading={deliveryMethod.loading}
            error={deliveryMethod.error}
            paginationMeta={deliveryMethod.meta}
            onRefresh={(params) => deliveryMethod.fetch(params)}
            helperText={required ? 'Required' : ''}
          />
        ) : null,
    },
    {
      id: 'currency_code',
      type: 'custom',
      label: 'Currency',
      required: true,
      defaultValue: 'CAD', // Set CAD as the default
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
        <Dropdown
          label="Currency"
          value={value ?? 'CAD'}
          onChange={onChange}
          options={currencyOptions}
          helperText={required ? 'Required' : ''}
        />
      ) : null,
    },
    {
      id: 'exchange_rate',
      type: 'custom',
      label: 'Exchange Rate',
      required: true,
      customRender: ({ value, onChange, required, watch }: CustomRenderParams) => {
        const selectedCurrency = watch?.('currency_code');
        
        // Hide if CAD
        if (selectedCurrency === 'CAD') return null;
        
        return (
          <BaseInput
            label="Exchange Rate"
            type="number"
            value={value ?? ''}
            onChange={onChange}
            required={required}
          />
        );
      },
    },
    {
      id: 'shipping_fee',
      type: 'number',
      label: 'Shipping Fee (Optional)',
      required: false,
      min: 0,
    },
    {
      id: 'note',
      type: 'textarea',
      label: 'Note (Optional)',
      required: false,
      rows: 3,
    },
  ].filter(Boolean) as FieldConfig[];
  
  const orderItemFields: MultiItemFieldConfig[] = [
    {
      id: 'show_barcode_toggle',
      label: 'Show Barcode',
      type: 'custom',
      required: false,
      component: ({ value, onChange }: RowAwareComponentProps) => (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(value)}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange?.(checked);
                setShowBarcode(checked);
              }}
              color="primary"
            />
          }
          label="Show barcode"
        />
      ),
    },
    {
      id: 'sku_id',
      label: 'SKU',
      type: 'custom',
      required: true,
      component: ({ value, onChange, required }: RowAwareComponentProps) =>
        onChange ? (
          <SkuDropdown
            value={value ?? ''}
            onChange={(value: string) => {
              const selected = sku.options.find((opt) => opt.value === value);
              setSkuDropdownState((prev) => ({
                ...prev,
                inputValue: selected?.label || '',
              }));
              setSelectedSkuId(value);
              onChange(value); // call parent
            }}
            inputValue={skuDropdownState.inputValue}
            onInputChange={(_, newValue, reason) => {
              if (reason === 'input') {
                setSkuDropdownState((prev) => ({
                  ...prev,
                  inputValue: newValue,
                  fetchParams: {
                    ...prev.fetchParams,
                    keyword: newValue,
                    offset: 0,
                  },
                }));
                handleSkuSearch(newValue);
              }
            }}
            options={sku.options}
            loading={sku.loading}
            error={sku.error}
            paginationMeta={sku.meta}
            fetchParams={skuFetchParams}
            setFetchParams={setSkuFetchParams}
            onRefresh={(params) => sku.fetch(params)}
            helperText={required ? 'Required' : ''}
          />
        ) : null,
    },
    {
      id: 'quantity_ordered',
      label: 'Quantity',
      type: 'number',
      required: true,
    },
    {
      id: 'price_id',
      label: 'Price ID',
      type: 'custom',
      required: true,
      component: ({ value, onChange, required }: RowAwareComponentProps) =>
        onChange ? (
          <PricingDropdown
            value={value ?? ''}
            onChange={(value: string) => {
              const selected = pricing.options.find((opt) => opt.value === value);
              setPricingDropdownState((prev) => ({
                ...prev,
                inputValue: selected?.label || '',
              }));
              onChange(value); // call parent
            }}
            inputValue={pricingDropdownState.inputValue}
            onInputChange={(_, newValue, reason) => {
              if (reason === 'input') {
                setPricingDropdownState((prev) => ({
                  ...prev,
                  inputValue: newValue,
                  fetchParams: {
                    ...prev.fetchParams,
                    keyword: newValue,
                    offset: 0,
                  },
                }));
                handlePricingSearch(newValue);
              }
            }}
            options={pricing.options}
            loading={pricing.loading}
            error={pricing.error}
            paginationMeta={pricing.meta}
            fetchParams={pricingFetchParams}
            setFetchParams={setPricingFetchParams}
            onRefresh={(params) => pricing.fetch(params)}
            helperText={required ? 'Required' : ''}
          />
        ) : null,
    },
    {
      id: 'override_price',
      type: 'custom',
      label: 'Override price',
      component: ({ value, onChange }: RowAwareComponentProps) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!value}
              onChange={(e) => onChange?.(e.target.checked)}
            />
          }
          label="Manually enter price"
        />
      ),
    },
    {
      id: 'price',
      type: 'custom',
      label: 'Price',
      required: true,
      component: ({ control, value, onChange, rowIndex }: RowAwareComponentProps) => (
        <PriceField
          control={control}
          value={value}
          onChange={onChange}
          rowIndex={rowIndex}
          pricingOptions={pricing.options}
        />
      ),
    },
  ];
  
  const formRef = useRef<CustomFormRef<CreateSalesOrderInput>>(null);
  const itemFormRef = useRef<MultiItemFormRef>(null);
  
  const handleFullSubmit = async () => {
    const rawFormValues = form.getValues(); // includes UI-only fields
    const rawItems = itemFormRef.current?.getItems() || [];

    // Destructure UI-only fields
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
        packaging_material_id: packaging_material_id || undefined, // null/'' fallback to undefined
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
      delete formValues.discount_id; // avoid sending ""
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

    console.log('📦 Final Payload:', payload);
    await handleSubmitSalesOrder('sales', payload);
  };
  
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
      
      <CustomForm
        ref={formRef}
        formInstance={form}
        fields={orderFields}
        submitButtonLabel="Next: Add Items"
        showSubmitButton={false}
      />
      
      <MultiItemForm
        ref={itemFormRef}
        fields={orderItemFields}
      />
      
      <CustomButton onClick={handleFullSubmit} loading={submitting}>
        Submit Order
      </CustomButton>
    </Box>
  );
};

export default CreateSaleOrderForm;
