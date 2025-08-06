import useDebouncedSearch from '@utils/hooks/useDebouncedSearch';
import type {
  CustomerLookupQuery,
  DeliveryMethodLookupQueryParams,
  DiscountLookupQueryParams,
  OrderTypeLookupQueryParams,
  PaymentMethodLookupQueryParams,
  PricingLookupQueryParams,
  SkuLookupQueryParams,
  TaxRateLookupQueryParams,
} from '@features/lookup/state';

type LookupBundles = {
  orderType: { fetch: (params?: OrderTypeLookupQueryParams) => void };
  customer: { fetch: (params?: CustomerLookupQuery) => void };
  paymentMethod: { fetch: (params?: PaymentMethodLookupQueryParams) => void };
  discount: { fetch: (params?: DiscountLookupQueryParams) => void };
  taxRate: { fetch: (params?: TaxRateLookupQueryParams) => void };
  deliveryMethod: { fetch: (params?: DeliveryMethodLookupQueryParams) => void };
  sku: { fetch: (params?: SkuLookupQueryParams) => void };
  pricing: { fetch: (params?: PricingLookupQueryParams) => void };
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
    handleDeliveryMethodSearch: useDebouncedSearch<DeliveryMethodLookupQueryParams>(
      bundles.deliveryMethod.fetch
    ),
    handleSkuSearch: useDebouncedSearch<SkuLookupQueryParams>(
      bundles.sku.fetch
    ),
    handlePricingSearch: useDebouncedSearch<PricingLookupQueryParams>(
      bundles.pricing.fetch
    ),
  };
};

export default useAllSalesOrderSearchHandlers;
