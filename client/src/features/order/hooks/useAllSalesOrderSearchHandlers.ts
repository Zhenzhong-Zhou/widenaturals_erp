import { useDebouncedSearch } from '@utils/hooks';
import type {
  CustomerLookupQuery,
  DeliveryMethodLookupQueryParams,
  DiscountLookupQueryParams,
  OrderTypeLookupQueryParams,
  PaymentMethodLookupQueryParams,
  PricingGroupLookupQueryParams,
  SkuLookupQueryParams,
  TaxRateLookupQueryParams,
  PackagingMaterialLookupQueryParams,
} from '@features/lookup/state';

type LookupBundles = {
  orderType: { fetch: (params?: OrderTypeLookupQueryParams) => void };
  customer: { fetch: (params?: CustomerLookupQuery) => void };
  paymentMethod: { fetch: (params?: PaymentMethodLookupQueryParams) => void };
  discount: { fetch: (params?: DiscountLookupQueryParams) => void };
  taxRate: { fetch: (params?: TaxRateLookupQueryParams) => void };
  deliveryMethod: { fetch: (params?: DeliveryMethodLookupQueryParams) => void };
  sku: { fetch: (params?: SkuLookupQueryParams) => void };
  pricingGroup: { fetch: (params?: PricingGroupLookupQueryParams) => void };
  packagingMaterial: {
    fetch: (params?: PackagingMaterialLookupQueryParams) => void;
  };
};

const useAllSalesOrderSearchHandlers = (
  bundles: LookupBundles,
  category?: string
) => {
  return {
    handleOrderTypeSearch: useDebouncedSearch<OrderTypeLookupQueryParams>(
      bundles.orderType.fetch,
      { category }
    ),
    handleCustomerSearch: useDebouncedSearch<CustomerLookupQuery>(
      bundles.customer.fetch
    ),
    handlePaymentSearch: useDebouncedSearch<PaymentMethodLookupQueryParams>(
      bundles.paymentMethod.fetch
    ),
    handleDiscountSearch: useDebouncedSearch<DiscountLookupQueryParams>(
      bundles.discount.fetch
    ),
    handleTaxRateSearch: useDebouncedSearch<TaxRateLookupQueryParams>(
      bundles.taxRate.fetch
    ),
    handleDeliveryMethodSearch:
      useDebouncedSearch<DeliveryMethodLookupQueryParams>(
        bundles.deliveryMethod.fetch
      ),
    handleSkuSearch: useDebouncedSearch<SkuLookupQueryParams>(
      bundles.sku.fetch
    ),
    handlePricingGroupSearch: useDebouncedSearch<PricingGroupLookupQueryParams>(
      bundles.pricingGroup.fetch
    ),
    handlePackagingMaterialSearch:
      useDebouncedSearch<PackagingMaterialLookupQueryParams>(
        bundles.packagingMaterial.fetch,
        { mode: 'salesDropdown' } // remove or change if you want generic
      ),
  };
};

export default useAllSalesOrderSearchHandlers;
