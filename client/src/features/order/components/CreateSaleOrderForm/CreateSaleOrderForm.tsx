import {
  type FC,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import { type CustomFormRef } from '@components/common/CustomForm';
import { type MultiItemFormRef } from '@components/common/MultiItemForm';
import CustomButton from '@components/common/CustomButton';
import { usePagePermissionState } from '@features/authorize/hooks';
import { PERMISSIONS } from '@utils/constants/orderPermissions';
import useSalesOrderCreate from '@hooks/useSalesOrderCreate';
import type {
  CreateSalesOrderForm,
  CreateSalesOrderInput,
} from '@features/order/state';
import useSalesOrderLookups from '@features/order/hooks/useSalesOrderLookups';
import type {
  AddressByCustomerLookup,
  CustomerLookupQuery,
  DeliveryMethodLookupQueryParams,
  DiscountLookupQueryParams,
  PackagingMaterialLookupQueryParams,
  PaymentMethodLookupQueryParams,
  PricingLookupQueryParams,
  SkuLookupQueryParams,
  TaxRateLookupQueryParams,
} from '@features/lookup/state';
import Alert from '@mui/material/Alert';
import {
  OrderDetailsSection,
  OrderItemSection,
} from '@features/order/components/CreateSaleOrderForm/index';
import useSalesOrderSubmission from '@features/order/hooks/useSalesOrderSubmission';
import useAllSalesOrderSearchHandlers from '@features/order/hooks/useAllSalesOrderSearchHandlers';
import useSkuPricingEffects from '@features/order/hooks/useSkuPricingEffects';
import {
  createDropdownBundle,
  fetchLookups,
  resetLookups,
} from '@utils/lookupHelpers';

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
  
  const { isAllowed: canCreateSalesOrder } =
    usePagePermissionState(PERMISSIONS.CREATE_SALES_ORDER);

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

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [showBarcode, setShowBarcode] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, any>[]>([]);

  // Dropdown state bundles
  const customerDropdown = createDropdownBundle<CustomerLookupQuery>();
  const paymentMethodDropdown =
    createDropdownBundle<PaymentMethodLookupQueryParams>();
  const discountDropdown = createDropdownBundle<DiscountLookupQueryParams>();
  const taxRateDropdown = createDropdownBundle<TaxRateLookupQueryParams>();
  const deliveryMethodDropdown =
    createDropdownBundle<DeliveryMethodLookupQueryParams>();

  const skuDropdown = createDropdownBundle<SkuLookupQueryParams>({
    includeBarcode: true,
  });
  const pricingDropdown = createDropdownBundle<PricingLookupQueryParams>({
    skuId: selectedSkuId ?? null,
    labelOnly: false,
  });
  // packaging dropdown state (default to salesDropdown mode so server enforces visible-only/active/unarchived)
  const packagingMaterialDropdown =
    createDropdownBundle<PackagingMaterialLookupQueryParams>({
      mode: 'salesDropdown',
    });

  // Initial fetch + cleanup
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
    if (!canCreateSalesOrder) {
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

  const addressOptions = customerAddresses.options.map(
    (address: AddressByCustomerLookup) => ({
      value: address.id,
      label: formatFullAddress(address),
    })
  );

  const isRowBlank = (row: Record<string, any>) => {
    const t = (row.line_type ?? 'sku') as 'sku' | 'packaging_material';
    const hasId = t === 'sku' ? !!row.sku_id : !!row.packaging_material_id;
    const hasQty = Number(row.quantity_ordered) > 0;
    const hasManual =
      !!row.override_price &&
      row.price !== '' &&
      row.price != null &&
      !Number.isNaN(Number(row.price));
    const hasPriceId = !!row.price_id;
    return !hasId && !hasQty && !hasManual && !hasPriceId;
  };

  const effectiveItems = items.filter((r) => !isRowBlank(r));

  const isValidItem = (row: Record<string, any>) => {
    const type = (row.line_type ?? 'sku') as 'sku' | 'packaging_material';
    const qtyOk = Number(row.quantity_ordered) > 0;

    if (type === 'sku') {
      const hasSku = !!row.sku_id;
      const override = !!row.override_price;
      const manualOk =
        override &&
        row.price !== '' &&
        row.price != null &&
        !Number.isNaN(Number(row.price));
      const priceIdOk = !override && !!row.price_id;
      return hasSku && qtyOk && (manualOk || priceIdOk);
    }

    // packaging: require id + qty; manual price only if override=true
    const hasPkg = !!row.packaging_material_id;
    const override = !!row.override_price;
    const manualOk =
      !override ||
      (row.price !== '' &&
        row.price != null &&
        !Number.isNaN(Number(row.price)));
    return hasPkg && qtyOk && manualOk;
  };

  const itemsOk =
    effectiveItems.length > 0 && effectiveItems.every(isValidItem);

  const hasValidSkuLine = effectiveItems.some(
    (r) => (r.line_type ?? 'sku') === 'sku' && isValidItem(r)
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
    <Box
      sx={{
        '--field-h': '56px',
        '--label-y': 'calc(var(--field-h)/2 - 12px)',
        '--label-y-shrink': '-9px',

        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 1.5, sm: 2.5 },
        py: 2.5,

        display: 'grid',
        rowGap: 5,

        // section "cards"
        '& .section-card': {
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 1,
          border: (t) => `1px solid ${t.palette.divider}`,
          p: { xs: 1.5, sm: 2.5 },
        },

        // normalize single‑line inputs
        '& .section-card .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': {
          height: 'var(--field-h)',
          borderRadius: 2,
        },
        '& .section-card .MuiOutlinedInput-input:not(textarea)': {
          height: '100%',
          py: 0,
        },
        '& .section-card .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          py: 0,
        },
        '& .section-card .MuiAutocomplete-root .MuiOutlinedInput-root': {
          height: 'var(--field-h)',
        },
        '& .section-card .MuiAutocomplete-inputRoot .MuiOutlinedInput-input': {
          height: '100%',
          py: 0,
        },

        // multiline (Note)
        '& .section-card .MuiInputBase-multiline.MuiOutlinedInput-root': {
          minHeight: 120,
          alignItems: 'flex-start',
          borderRadius: 3,
        },
        '& .section-card .MuiInputBase-multiline .MuiOutlinedInput-input': {
          height: 'auto',
          py: 1.25,
        },

        // label alignment for 56px fields
        '& .section-card .MuiInputLabel-formControl': {
          transform: `translate(14px, var(--label-y)) scale(1)`,
        },
        '& .section-card .MuiInputLabel-shrink': {
          transform: `translate(14px, var(--label-y-shrink)) scale(0.75)`,
        },

        // radios/switches vertically centered versus neighbors
        '& .section-card .MuiFormGroup-root, & .section-card .MuiFormControlLabel-root':
          {
            minHeight: 'var(--field-h)',
            alignItems: 'center',
          },

        // helper text compact
        '& .section-card .MuiFormHelperText-root': { mt: 0.5 },

        // alerts spacing
        '& .MuiAlert-root': { mb: 2 },
      }}
    >
      {orderError && (
        <Alert severity="error">
          {typeof orderError === 'string'
            ? orderError
            : 'Something went wrong.'}
        </Alert>
      )}

      {orderId && (
        <Alert severity="success">
          Order created successfully! ID: {orderId}
        </Alert>
      )}

      <Box className="section-card">
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
      </Box>

      <Box className="section-card">
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
      </Box>

      {/* Action area + info */}
      <Box sx={{ display: 'grid', rowGap: 12 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 12,
            justifyContent: { xs: 'stretch', sm: 'flex-start' },
            flexWrap: 'wrap',
          }}
        >
          <CustomButton
            onClick={handleFullSubmit}
            loading={submitting}
            disabled={!canSubmit}
          >
            Submit Order
          </CustomButton>
        </Box>

        {!hasValidSkuLine && (
          <Alert severity="info">
            At least one SKU item is required; packaging-only orders aren’t
            allowed.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default CreateSaleOrderForm;
