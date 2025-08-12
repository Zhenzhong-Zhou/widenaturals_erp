import { type FC, type RefObject, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CustomTypography from '@components/common/CustomTypography.tsx';
import CustomDatePicker from '@components/common/CustomDatePicker.tsx';
import CustomerDropdown from '@features/lookup/components/CustomerDropdown.tsx';
import OrderTypeDropdown from '@features/lookup/components/OrderTypesDropdown.tsx';
import PaymentMethodDropdown from '@features/lookup/components/PaymentMethodDropdown.tsx';
import DiscountDropdown from '@features/lookup/components/DiscountDropdown.tsx';
import TaxRateDropdown from '@features/lookup/components/TaxRateDropdown.tsx';
import DeliveryMethodDropdown from '@features/lookup/components/DeliveryMethodDropdown.tsx';
import Dropdown from '@components/common/Dropdown.tsx';
import BaseInput from '@components/common/BaseInput.tsx';
import CustomForm, {
  type CustomFormRef,
  type CustomRenderParams,
  type FieldConfig,
} from '@components/common/CustomForm.tsx';
import type {
  LookupOption,
  CustomerLookupQuery,
  PaymentMethodLookupQueryParams,
  DiscountLookupQueryParams,
  TaxRateLookupQueryParams,
  DeliveryMethodLookupQueryParams, LookupBundle, OrderTypeLookupQueryParams,
} from '@features/lookup/state';
import { transformLookupOptions } from '@utils/lookupTransformers.ts';
import currencyCodes from 'currency-codes';
import type { UsePaginatedDropdownReturn } from '@utils/lookupHelpers.ts';
import type { CreateSalesOrderInput } from '@features/order/state';

type Props = {
  formInstance: any;
  formRef: RefObject<CustomFormRef<CreateSalesOrderInput> | null>;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string) => void;
  addressOptions: LookupOption[];
  
  // Lookup bundles (simplified)
  orderType: LookupBundle<OrderTypeLookupQueryParams>;
  customer: LookupBundle<CustomerLookupQuery>;
  paymentMethod: LookupBundle<PaymentMethodLookupQueryParams>;
  discount: LookupBundle<DiscountLookupQueryParams>;
  taxRate: LookupBundle<TaxRateLookupQueryParams>;
  deliveryMethod: LookupBundle<DeliveryMethodLookupQueryParams>;
  
  // Paginated dropdowns
  customerDropdown: UsePaginatedDropdownReturn<CustomerLookupQuery>;
  paymentMethodDropdown: UsePaginatedDropdownReturn<PaymentMethodLookupQueryParams>;
  discountDropdown: UsePaginatedDropdownReturn<DiscountLookupQueryParams>;
  taxRateDropdown: UsePaginatedDropdownReturn<TaxRateLookupQueryParams>;
  deliveryMethodDropdown: UsePaginatedDropdownReturn<DeliveryMethodLookupQueryParams>;
  
  // Search + refresh handlers
  handleOrderTypeSearch: (keyword: string) => void;
  handleCustomerSearch: (keyword: string) => void;
  handlePaymentSearch: (keyword: string) => void;
  handleDiscountSearch: (keyword: string) => void;
  handleTaxRateSearch: (keyword: string) => void;
  handleDeliveryMethodSearch: (keyword: string) => void;
  refreshOrderTypes: () => void;
};

const OrderDetailsSection: FC<Props> = ({
                                          formInstance,
                                          formRef,
                                          selectedCustomerId,
                                          setSelectedCustomerId,
                                          addressOptions,
                                          
                                          // Lookup bundles
                                          orderType,
                                          customer,
                                          paymentMethod,
                                          discount,
                                          taxRate,
                                          deliveryMethod,
                                          
                                          // Dropdown grouped state/handlers
                                          customerDropdown,
                                          paymentMethodDropdown,
                                          discountDropdown,
                                          taxRateDropdown,
                                          deliveryMethodDropdown,
                                          
                                          // Search + refresh
                                          handleOrderTypeSearch,
                                          handleCustomerSearch,
                                          handlePaymentSearch,
                                          handleDiscountSearch,
                                          handleTaxRateSearch,
                                          handleDeliveryMethodSearch,
                                          refreshOrderTypes,
                                        }) => {
  const billingSameAsShipping = useWatch({
    control: formInstance.control,
    name: 'billing_same_as_shipping',
  });
  
  const formattedOrderTypes = useMemo(
    () => transformLookupOptions(orderType.options ?? [], { preserveHyphen: true }),
    [orderType.options]
  );
  
  const currencyOptions = useMemo(() => {
    return currencyCodes.codes().reduce((acc, code) => {
      const currency = currencyCodes.code(code);
      if (currency) {
        acc.push({
          value: currency.code,
          label: `${currency.code} - ${currency.currency}`,
        });
      }
      return acc;
    }, [] as LookupOption[]);
  }, []);
  
  const addressFields: FieldConfig[] = [];
  
  if (selectedCustomerId) {
    addressFields.push(
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
      }
    );
    
    if (!billingSameAsShipping) {
      addressFields.push({
        id: 'billing_address_id',
        type: 'select',
        label: 'Billing Address',
        required: true,
        options: addressOptions,
      });
    }
  }
  
  const fields: FieldConfig[] = [
    {
      id: 'order_type_id',
      label: 'Order Type',
      type: 'custom',
      required: true,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
          <OrderTypeDropdown
            value={value ?? ''}
            onChange={(id) => id !== value && onChange(id)}
            orderTypeOptions={formattedOrderTypes}
            orderTypeLoading={orderType.loading}
            orderTypeError={orderType.error}
            onKeywordSearch={handleOrderTypeSearch}
            onRefresh={refreshOrderTypes}
            disabled={orderType.loading}
            helperText={required ? 'Required' : ''}
          />
        ) : null,
    },
    {
      id: 'order_date',
      label: 'Order Date',
      type: 'custom',
      required: true,
      customRender: ({ value, onChange }: CustomRenderParams) => {
        const d = value ? new Date(value) : new Date();
        // if no value yet, write the default into RHF so watch() sees it
        if (!value) onChange?.(d.toISOString());
        
        return (
          <CustomDatePicker
            label="Order Date"
            value={d}
            onChange={(date) => onChange?.(date ? date.toISOString() : '')}
            required
          />
        );
      },
    },
    {
      id: 'customer_id',
      label: 'Customer',
      type: 'custom',
      required: true,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
          <CustomerDropdown
            value={value ?? ''}
            onChange={(id) => {
              onChange(id);
              setSelectedCustomerId(id);
              
              const matched = customer.options.find((opt) => opt.value === id);
              customerDropdown.setDropdownState((prev) => ({
                ...prev,
                inputValue: matched?.label ?? '',
              }));
            }}
            inputValue={customerDropdown.dropdownState.inputValue}
            onInputChange={(_e, newValue, reason) => {
              if (reason === 'input') {
                customerDropdown.setDropdownState((prev) => ({
                  ...prev,
                  inputValue: newValue,
                  fetchParams: {
                    ...prev.fetchParams,
                    keyword: newValue,
                    offset: 0,
                  },
                }));
                handleCustomerSearch(newValue);
              }
            }}
            options={customer.options}
            loading={customer.loading}
            error={customer.error}
            paginationMeta={customer.meta}
            fetchParams={customerDropdown.fetchParams}
            setFetchParams={customerDropdown.setFetchParams}
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
    ...addressFields,
    {
      id: 'payment_method_id',
      type: 'custom',
      label: 'Payment Method',
      required: true,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
          <PaymentMethodDropdown
            value={value ?? ''}
            onChange={onChange}
            inputValue={paymentMethodDropdown.dropdownState.inputValue}
            fetchParams={paymentMethodDropdown.fetchParams}
            setFetchParams={paymentMethodDropdown.setFetchParams}
            onInputChange={(_e, newValue) => {
              paymentMethodDropdown.setDropdownState((prev) => ({
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
      label: 'Discount (Optional)',
      type: 'custom',
      customRender: ({ value, onChange }: CustomRenderParams) =>
        onChange ? (
          <DiscountDropdown
            value={value ?? ''}
            onChange={onChange}
            inputValue={discountDropdown.dropdownState.inputValue}
            fetchParams={discountDropdown.fetchParams}
            setFetchParams={discountDropdown.setFetchParams}
            onInputChange={(_e, newValue) => {
              discountDropdown.setDropdownState((prev) => ({
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
          />
        ) : null,
    },
    {
      id: 'tax_rate_id',
      label: 'Tax Rate',
      type: 'custom',
      required: true,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
          <TaxRateDropdown
            value={value ?? ''}
            onChange={(id) => {
              onChange?.(id);
              
              const matchedOption = taxRate.options.find(opt => opt.value === id);
              
              taxRateDropdown.setDropdownState((prev) => ({
                ...prev,
                inputValue: matchedOption?.label ?? '', // Ensure label shown, not UUID
              }));
            }}
            inputValue={taxRateDropdown.dropdownState.inputValue}
            fetchParams={taxRateDropdown.fetchParams}
            setFetchParams={taxRateDropdown.setFetchParams}
            onInputChange={(_e, newValue, reason) => {
              if (reason !== 'input') return;
              taxRateDropdown.setDropdownState((prev) => ({
                ...prev,
                inputValue: newValue,
                fetchParams: {
                  ...prev.fetchParams,
                  keyword: newValue,
                  offset: 0,
                },
              }));
              handleTaxRateSearch(newValue);
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
      label: 'Delivery Method',
      type: 'custom',
      required: true,
      customRender: ({ value, onChange, required }: CustomRenderParams) =>
        onChange ? (
          <DeliveryMethodDropdown
            value={value ?? ''}
            onChange={onChange}
            inputValue={deliveryMethodDropdown.dropdownState.inputValue}
            fetchParams={deliveryMethodDropdown.fetchParams}
            setFetchParams={deliveryMethodDropdown.setFetchParams}
            onInputChange={(_e, newValue) => {
              deliveryMethodDropdown.setDropdownState((prev) => ({
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
      label: 'Currency',
      type: 'custom',
      required: true,
      defaultValue: 'CAD',
      customRender: ({ value, onChange }: CustomRenderParams) =>
        onChange ? (
          <Dropdown
            label="Currency"
            value={value ?? 'CAD'}
            onChange={onChange}
            options={currencyOptions}
          />
        ) : null,
    },
    {
      id: 'exchange_rate',
      label: 'Exchange Rate',
      type: 'custom',
      required: true,
      customRender: ({ value, onChange, watch }: CustomRenderParams) => {
        const selectedCurrency = watch?.('currency_code');
        if (selectedCurrency === 'CAD') return null;
        
        return (
          <BaseInput
            label="Exchange Rate"
            type="number"
            value={value ?? ''}
            onChange={onChange}
            required
          />
        );
      },
    },
    {
      id: 'shipping_fee',
      label: 'Shipping Fee (Optional)',
      type: 'number',
      min: 0,
    },
    {
      id: 'note',
      label: 'Note (Optional)',
      type: 'textarea',
      rows: 3,
    },
  ];
  
  return (
    <CustomForm
      ref={formRef}
      formInstance={formInstance}
      fields={fields}
      showSubmitButton={false}
    />
  );
};

export default OrderDetailsSection;
