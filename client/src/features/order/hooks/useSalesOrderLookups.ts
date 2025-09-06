import useOrderTypeLookup from '@hooks/useOrderTypeLookup';
import useCustomerLookup from '@hooks/useCustomerLookup';
import useCustomerAddressesLookup from '@hooks/useCustomerAddresseslookup';
import usePaymentMethodLookup from '@hooks/usePaymentMethodLookup';
import useDiscountLookup from '@hooks/useDiscountLookup';
import useTaxRateLookup from '@hooks/useTaxRateLookup';
import useDeliveryMethodLookup from '@hooks/useDeliveryMethodLookup';
import useSkuLookup from '@hooks/useSkuLookup';
import usePricingLookup from '@hooks/usePricingLookup';
import usePackagingMaterialLookup from '@hooks/usePackagingMaterialLookup';

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
  const pricing = usePricingLookup();
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
    pricing,
    packagingMaterial,
  };
};

export default useSalesOrderLookups;
