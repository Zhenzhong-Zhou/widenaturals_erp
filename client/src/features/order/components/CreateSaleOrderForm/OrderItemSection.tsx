import { type FC, type RefObject, useMemo } from 'react';
import { Checkbox, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Switch } from '@mui/material';
import MultiItemForm, {
  type MultiItemFieldConfig, type MultiItemFormRef,
  type RowAwareComponentProps,
} from '@components/common/MultiItemForm';
import SkuDropdown from '@features/lookup/components/SkuDropdown';
import PricingDropdown from '@features/lookup/components/PricingDropdown';
import PackagingMaterialDropdown from '@features/lookup/components/PackagingMaterialDropdown';
import type {
  LookupBundle,
  PricingLookupQueryParams,
  SkuLookupQueryParams,
  PackagingMaterialLookupQueryParams,
} from '@features/lookup/state';
import { PriceField } from '@features/order/components/CreateSaleOrderForm/index';
import type { UsePaginatedDropdownReturn } from '@utils/lookupHelpers';

type OrderItemSectionProps = {
  formRef: RefObject<MultiItemFormRef | null>;
  onItemsChange?: (items: Record<string, any>[]) => void;
  
  // Lookup bundles
  sku: LookupBundle<SkuLookupQueryParams>;
  pricing: LookupBundle<PricingLookupQueryParams>;
  packagingMaterial: LookupBundle<PackagingMaterialLookupQueryParams>;
  
  // Paginated dropdowns
  skuDropdown: UsePaginatedDropdownReturn<SkuLookupQueryParams>;
  pricingDropdown: UsePaginatedDropdownReturn<PricingLookupQueryParams>;
  packagingMaterialDropdown: UsePaginatedDropdownReturn<PackagingMaterialLookupQueryParams>;
  
  // Search handlers
  handleSkuSearch: (keyword: string) => void;
  handlePricingSearch: (keyword: string) => void;
  handlePackagingMaterialSearch: (keyword: string) => void;
  
  setSelectedSkuId: (id: string) => void;
  
  // Barcode toggle
  showBarcode: boolean;
  setShowBarcode: (val: boolean) => void;
};

const OrderItemSection: FC<OrderItemSectionProps> = ({
                                                       formRef,
                                                       onItemsChange,
                                                       sku,
                                                       pricing,
                                                       packagingMaterial,
                                                       skuDropdown,
                                                       pricingDropdown,
                                                       packagingMaterialDropdown,
                                                       setSelectedSkuId,
                                                       handleSkuSearch,
                                                       handlePricingSearch,
                                                       handlePackagingMaterialSearch,
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
  
  const {
    dropdownState: packagingDropdownState,
    setDropdownState: setPackagingDropdownState,
    fetchParams: packagingFetchParams,
    setFetchParams: setPackagingFetchParams,
  } = packagingMaterialDropdown;
  
  const orderItemFields: MultiItemFieldConfig[] = useMemo(
    () => [
      // line type switch
      {
        id: 'line_type',
        label: 'Line Type',
        type: 'custom',
        required: true,
        component: ({ value, onChange, getRowValues, setRowValues }: RowAwareComponentProps) => {
          const current = (value as 'sku' | 'packaging_material') ?? 'sku';
          return (
            <FormControl>
              <FormLabel>Line Type</FormLabel>
              <RadioGroup
                row
                value={current}
                onChange={(_, v) => {
                  const next = (v as 'sku' | 'packaging_material') || 'sku';
                  onChange?.(next);
                  // Ensure mutually exclusive IDs
                  const rowVals = getRowValues?.() ?? {};
                  if (next === 'sku' && rowVals.packaging_material_id) {
                    setRowValues?.({ ...rowVals, packaging_material_id: null, price_id: null });
                  }
                  if (next === 'packaging_material' && rowVals.sku_id) {
                    setRowValues?.({ ...rowVals, sku_id: null, price_id: null });
                  }
                }}
              >
                <FormControlLabel value="sku" control={<Radio />} label="SKU" />
                <FormControlLabel value="packaging_material" control={<Radio />} label="Packaging" />
              </RadioGroup>
            </FormControl>
          );
        },
      },
      
      // Barcode toggle (SKU only)
      {
        id: 'show_barcode_toggle',
        label: 'Show Barcode',
        type: 'custom',
        conditional: (row) => (row?.line_type ?? 'sku') === 'sku',
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
      
      // SKU dropdown (only when line_type === 'sku')
      {
        id: 'sku_id',
        label: 'SKU',
        type: 'custom',
        required: true,
        conditional: (row) => (row?.line_type ?? 'sku') === 'sku',
        component: ({ value, onChange, required, getRowValues, setRowValues }: RowAwareComponentProps) =>
          onChange ? (
            <SkuDropdown
              value={value ?? ''}
              onChange={(val: string) => {
                onChange(val);
                
                // clear opposite field + price fields on SKU change
                const row = getRowValues?.() ?? {};
                setRowValues?.({
                  ...row,
                  packaging_material_id: null,
                  price_id: null,
                  price_label: '',
                  override_price: false,
                  price: '',
                });
                
                // fetch prices for THIS row’s SKU (not global)
                const next = { ...(pricingFetchParams ?? {}), skuId: val || null, keyword: '', offset: 0 };
                setPricingFetchParams(next);
                pricing.fetch(next);
              }}
              onInputChange={(_, newValue, reason) => {
                if (reason !== 'input') return;
                // normal SKU keyword search (unchanged)
                setSkuDropdownState(prev => ({
                  ...prev,
                  inputValue: newValue,
                  fetchParams: { ...prev.fetchParams, keyword: newValue, offset: 0 },
                }));
                handleSkuSearch(newValue);
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
      
      // Packaging dropdown (only when line_type === 'packaging_material')
      {
        id: 'packaging_material_id',
        label: 'Packaging',
        type: 'custom',
        required: true,
        conditional: (row) => (row?.line_type ?? 'sku') === 'packaging_material',
        component: ({ value, onChange, required, getRowValues, setRowValues }: RowAwareComponentProps) =>
          onChange ? (
            <PackagingMaterialDropdown
              label="Select Packaging"
              value={value ?? ''}
              onChange={(val: string) => {
                const selected = packagingMaterial.options.find((opt) => opt.value === val);
                setPackagingDropdownState((prev) => ({ ...prev, inputValue: selected?.label || '' }));
                onChange(val);
                // Clear sku id if present
                const rowVals = getRowValues?.() ?? {};
                if (rowVals.sku_id) {
                  setRowValues?.({ ...rowVals, sku_id: null });
                }
              }}
              onInputChange={(_, newValue, reason) => {
                if (reason === 'input') {
                  setPackagingDropdownState((prev) => ({
                    ...prev,
                    inputValue: newValue,
                    fetchParams: {
                      ...prev.fetchParams,
                      keyword: newValue,
                      offset: 0,
                      mode: 'salesDropdown', // server enforces curated list
                    },
                  }));
                  handlePackagingMaterialSearch(newValue);
                }
              }}
              options={packagingMaterial.options}
              loading={packagingMaterial.loading}
              error={packagingMaterial.error}
              paginationMeta={packagingMaterial.meta}
              fetchParams={packagingFetchParams}
              setFetchParams={setPackagingFetchParams}
              onRefresh={(params) => packagingMaterial.fetch(params)}
              helperText={required ? 'Required' : ''}
            />
          ) : null,
      },
      
      // Quantity
      {
        id: 'quantity_ordered',
        label: 'Quantity',
        type: 'number',
        required: true,
        validation: (v): string | undefined => {
          if (v === '' || v == null) return 'Required';
          const n = Number(v);
          if (!Number.isFinite(n)) return 'Enter a number';
          if (!Number.isInteger(n)) return 'Must be an integer'; // drop if decimals allowed
          if (n <= 0) return 'Must be greater than 0';
          return undefined;
        },
      },
      
      // Pricing (SKU only; packaging has no price_id field)
      {
        id: 'price_id',
        label: 'Price ID',
        type: 'custom',
        required: true,
        conditional: (row) => (row?.line_type ?? 'sku') === 'sku' && !row?.override_price,
        component: ({ value, onChange, required, getRowValues, setRowValues }: RowAwareComponentProps) => {
          const row = getRowValues?.() ?? {};
          const rowSku: string | null = row.sku_id ?? null;
          
          // Build an options list that always includes the currently selected price_id
          const inList = value ? pricing.options.some(o => o.value === value) : true;
          const mergedOptions = !inList && value
            ? [{ value, label: row.price_label || '(selected)' }, ...pricing.options]
            : pricing.options;
          
          return onChange ? (
            <PricingDropdown
              label={'Select A Pricing'}
              key={rowSku || 'no-sku'}
              value={value ?? ''}
              disabled={!rowSku}
              onChange={(val: string) => {
                onChange(val);
                // cache label in the row so it keeps displaying even if global options change later
                const picked = pricing.options.find(o => o.value === val);
                setRowValues?.({ ...row, price_id: val, price_label: picked?.label ?? '' });
              }}
              options={mergedOptions}
              loading={pricing.loading}
              error={!rowSku ? 'Select a SKU first.' : pricing.error}
              paginationMeta={pricing.meta}
              // keep skuId bound to this row for any programmatic refresh
              fetchParams={{ ...(pricingFetchParams ?? {}), skuId: rowSku }}
              setFetchParams={setPricingFetchParams}
              onRefresh={(params) => {
                if (!rowSku) return;
                const next = { ...(params ?? {}), skuId: rowSku, offset: params?.offset ?? 0 };
                setPricingFetchParams(next);
                pricing.fetch(next);
              }}
              onInputChange={(_, newValue, reason) => {
                if (reason !== 'input' || !rowSku) return;
                const next = { ...(pricingFetchParams ?? {}), keyword: newValue, skuId: rowSku, offset: 0 };
                setPricingFetchParams(next);
                handlePricingSearch(newValue);      // debounced keyword search
              }}
              helperText={!rowSku ? 'Select a SKU first' : (required ? 'Required' : '')}
            />
          ) : null;
        },
      },
      
      // Manual price toggle
      {
        id: 'override_price',
        type: 'custom',
        label: 'Override price',
        component: ({ value, onChange, getRowValues, setRowValues }: RowAwareComponentProps) => (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onChange?.(checked);
                  const row = getRowValues?.() ?? {};
                  // When turning override off, clear manual price and keep price_id visible again.
                  if (!checked && row.price != null) {
                    setRowValues?.({ ...row, price: '' });
                  }
                }}
              />
            }
            label="Manually enter price"
          />
        ),
      },
      
      // Price input only when override is ON (SKU or Packaging)
      {
        id: 'price',
        type: 'custom',
        label: 'Price',
        required: true,
        conditional: (row) => !!row?.override_price,
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
      packagingMaterial,
      skuDropdownState,
      pricingDropdownState,
      packagingDropdownState,
      showBarcode,
      handleSkuSearch,
      handlePricingSearch,
      handlePackagingMaterialSearch,
      setSkuDropdownState,
      setPricingDropdownState,
      setPackagingDropdownState,
      setSelectedSkuId,
      skuFetchParams,
      setSkuFetchParams,
      pricingFetchParams,
      setPricingFetchParams,
      packagingFetchParams,
      setPackagingFetchParams,
    ]
  );
  
  // Row title -> selected label, else “SKU line” / “Packaging line”
  const getItemTitle = (_index: number, row: Record<string, any>) => {
    const lt = (row?.line_type as 'sku' | 'packaging_material') ?? 'sku';
    if (lt === 'sku') {
      const lbl = sku.options.find(o => o.value === row?.sku_id)?.label;
      return lbl ? `SKU — ${lbl}` : 'SKU line';
    }
    const lbl = packagingMaterial.options.find(o => o.value === row?.packaging_material_id)?.label;
    return lbl ? `Packaging — ${lbl}` : 'Packaging line';
  };
  
  // Start with one SKU row + one Packaging row
  const defaultValues = [
    { line_type: 'sku', quantity_ordered: '', override_price: false },
    { line_type: 'packaging_material', quantity_ordered: '', price: 0 },
  ];
  
  return (
    <MultiItemForm
      ref={formRef}
      fields={orderItemFields}
      onItemsChange={onItemsChange}
      getItemTitle={getItemTitle}
      defaultValues={defaultValues}
      validation={() =>
        Object.fromEntries(
          orderItemFields.filter((f) => f.validation).map((f) => [f.id, f.validation!])
        )
      }
      showSubmitButton={false}
    />
  );
};

export default OrderItemSection;
