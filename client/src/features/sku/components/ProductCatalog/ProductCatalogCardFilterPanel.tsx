import { type FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import FilterPanelLayout from "@components/common/FilterPanelLayout";
import type { SkuProductCardFilters } from "@features/sku/state";
import {
  renderInputField,
  renderSelectField
} from '@utils/filters/filterUtils';
import type { FilterField } from '@shared-types/shared';
import {
  COUNTRY_CODE_OPTIONS,
  MARKET_REGION_OPTIONS
} from '@utils/constants/productCatalogFilters';
import { normalize } from '@utils/stringUtils';

interface Props {
  filters: SkuProductCardFilters;
  onChange: (filters: SkuProductCardFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

// Default filter values
const emptyFilters: SkuProductCardFilters = {
  brand: "",
  category: "",
  marketRegion: "",
  sizeLabel: "",
  keyword: "",
};

// Text input fields
const TEXT_FIELDS: FilterField<SkuProductCardFilters>[] = [
  { name: "keyword", label: "Keyword", type: "text", placeholder: "Name, brand, SKU…" },
  { name: "productName", label: "Product Name", type: "text" },
  { name: "brand", label: "Brand", type: "text" },
  { name: "category", label: "Category", type: "text" },
  { name: "sizeLabel", label: "Size Label", type: "text" },
  { name: "complianceId", label: "Compliance Number (NPN)", type: "text" },
];

// Select fields
const SELECT_FIELDS: FilterField<SkuProductCardFilters>[] = [
  {
    name: 'marketRegion',
    label: 'Market Region',
    type: 'select',
    options: MARKET_REGION_OPTIONS,
  },
  {
    name: 'countryCode',
    label: 'Country Code',
    type: 'select',
    options: COUNTRY_CODE_OPTIONS,
  },
];

const ProductCatalogCardFilterPanel: FC<Props> = ({
                                                filters,
                                                onChange,
                                                onApply,
                                                onReset,
                                              }) => {
  const { control, handleSubmit, reset } = useForm<SkuProductCardFilters>({
    defaultValues: filters,
  });
  
  // Sync external filters → form
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
  
  // Handlers
  const submitFilters = (data: SkuProductCardFilters) => {
    const cleaned = {
      ...data,
      keyword: data.keyword?.trim() || undefined,
      productName: normalize(data.productName),
      brand: normalize(data.brand),
      category: normalize(data.category),
      sizeLabel: normalize(data.sizeLabel),
      complianceId: normalize(data.complianceId),
      marketRegion: normalize(data.marketRegion),
      countryCode: normalize(data.countryCode),
      // skuStatusId: normalize(data.skuStatusId),
      // productStatusId: normalize(data.productStatusId),
      // skuIds: data.skuIds?.length ? data.skuIds : undefined,
    };
    
    onChange(cleaned);
    onApply();
  };
  
  // --- Reset filters ---
  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };
  
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        {/* --- Text Inputs --- */}
        {TEXT_FIELDS.map((f) =>
          renderInputField(control, f.name, f.label, f.placeholder)
        )}
        
        {SELECT_FIELDS.map((f) =>
          renderSelectField(control, f.name, f.label, f.options)
        )}
        
        {/* --- Status Filters --- */}
        {/*{renderInputField(control, 'productStatusId', 'Product Status ID')}*/}
        {/*{renderInputField(control, 'skuStatusId', 'SKU Status ID')}*/}
      </FilterPanelLayout>
    </form>
  );
};

export default ProductCatalogCardFilterPanel;
