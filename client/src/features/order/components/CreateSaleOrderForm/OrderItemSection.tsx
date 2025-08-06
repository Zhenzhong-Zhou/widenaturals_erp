import { type FC, type RefObject, useMemo } from 'react';
import { Checkbox, FormControlLabel, Switch } from '@mui/material';
import MultiItemForm, {
  type MultiItemFieldConfig, type MultiItemFormRef,
  type RowAwareComponentProps,
} from '@components/common/MultiItemForm';
import SkuDropdown from '@features/lookup/components/SkuDropdown';
import PricingDropdown from '@features/lookup/components/PricingDropdown';
import type {
  LookupBundle,
  PricingLookupQueryParams,
  SkuLookupQueryParams,
} from '@features/lookup/state';
import { PriceField } from '@features/order/components/CreateSaleOrderForm/index';
import type { UsePaginatedDropdownReturn } from '@utils/lookupHelpers';

type OrderItemSectionProps = {
  formRef: RefObject<MultiItemFormRef | null>;
  
  // Lookup bundles
  sku: LookupBundle<SkuLookupQueryParams>;
  pricing: LookupBundle<PricingLookupQueryParams>;
  
  // Paginated dropdowns
  skuDropdown: UsePaginatedDropdownReturn<SkuLookupQueryParams>;
  pricingDropdown: UsePaginatedDropdownReturn<PricingLookupQueryParams>;
  
  // Search handlers
  handleSkuSearch: (keyword: string) => void;
  handlePricingSearch: (keyword: string) => void;
  
  setSelectedSkuId: (id: string) => void;
  
  // Barcode toggle
  showBarcode: boolean;
  setShowBarcode: (val: boolean) => void;
};

const OrderItemSection: FC<OrderItemSectionProps> = ({
                                                       formRef,
                                                       sku,
                                                       pricing,
                                                       skuDropdown,
                                                       setSelectedSkuId,
                                                       pricingDropdown,
                                                       handleSkuSearch,
                                                       handlePricingSearch,
                                                       showBarcode,
                                                       setShowBarcode,
                                                     }) => {
  const {
    dropdownState: skuDropdownState,
    setDropdownState: setSkuDropdownState,
    fetchParams: skuFetchParams,
    setFetchParams: setSkuFetchParams,
  } = skuDropdown;
  
  const {
    dropdownState: pricingDropdownState,
    setDropdownState: setPricingDropdownState,
    fetchParams: pricingFetchParams,
    setFetchParams: setPricingFetchParams,
  } = pricingDropdown;
  
  const orderItemFields: MultiItemFieldConfig[] = useMemo(
    () => [
      {
        id: 'show_barcode_toggle',
        label: 'Show Barcode',
        type: 'custom',
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
              onChange={(val: string) => {
                const selected = sku.options.find((opt) => opt.value === val);
                setSkuDropdownState((prev) => ({
                  ...prev,
                  inputValue: selected?.label || '',
                }));
                setSelectedSkuId(val);
                onChange(val);
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
              onChange={(val: string) => {
                const selected = pricing.options.find((opt) => opt.value === val);
                setPricingDropdownState((prev) => ({
                  ...prev,
                  inputValue: selected?.label || '',
                }));
                onChange(val);
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
    ],
    [
      sku,
      pricing,
      skuDropdownState,
      pricingDropdownState,
      showBarcode,
      handleSkuSearch,
      handlePricingSearch,
      setSkuDropdownState,
      setPricingDropdownState,
      setSelectedSkuId,
      skuFetchParams,
      setSkuFetchParams,
      pricingFetchParams,
      setPricingFetchParams,
    ]
  );
  
  return (
    <MultiItemForm
      ref={formRef}
      fields={orderItemFields}
    />
  );
};

export default OrderItemSection;
