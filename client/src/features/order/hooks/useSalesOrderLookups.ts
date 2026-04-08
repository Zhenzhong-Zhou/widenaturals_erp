import {
  useCustomerAddressesLookup,
  useCustomerLookup,
  useDeliveryMethodLookup,
  useDiscountLookup,
  useOrderTypeLookup,
  usePackagingMaterialLookup,
  usePaymentMethodLookup,
  usePricingGroupLookup,
  useSkuLookup,
  useTaxRateLookup,
} from '@hooks/index';

/**
 * Aggregates all lookups needed for the Sales Order form.
 */
const useSalesOrderLookups = () => {
  const orderType = useOrderTypeLookup();
  const customer = useCustomerLookup({ keyword: '' }, false);
  const customerAddresses = useCustomerAddressesLookup();
  const paymentMethod = usePaymentMethodLookup();
  const discount = useDiscountLookup();
  const taxRate = useTaxRateLookup();
  const deliveryMethod = useDeliveryMethodLookup();
  const sku = useSkuLookup();
  const pricingGroup = usePricingGroupLookup();
  const packagingMaterial = usePackagingMaterialLookup();

  return {
    orderType,
    customer,
    customerAddresses,
    paymentMethod,
    discount,
    taxRate,
    deliveryMethod,
    sku,
    pricingGroup,
    packagingMaterial,
  };
};

export default useSalesOrderLookups;
