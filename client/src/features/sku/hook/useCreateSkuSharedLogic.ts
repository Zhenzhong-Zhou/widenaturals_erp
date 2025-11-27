import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import usePermissions from '@hooks/usePermissions';
import useHasPermission from '@features/authorize/hooks/useHasPermission';
import useSkuCodeBaseLookup from '@hooks/useSkuCodeBaseLookup';
import useProductLookup from '@hooks/useProductLookup';
import useCreateSkus from '@hooks/useCreateSkus';
import useSkuFormSearchHandlers from '@features/sku/hook/useSkuFormSearchHandlers';
import {
  createDropdownBundle,
  fetchLookups,
  resetLookups,
} from '@utils/lookupHelpers';

interface CreateSkuSharedLogic {
  // permissions
  permLoading: boolean;
  canCreateSku: boolean;
  
  // lookups
  skuCodeBase: ReturnType<typeof useSkuCodeBaseLookup>;
  product: ReturnType<typeof useProductLookup>;
  
  // dropdown bundles
  skuCodeBaseDropdown: ReturnType<typeof createDropdownBundle>;
  productDropdown: ReturnType<typeof createDropdownBundle>;
  
  // search handlers
  handleSkuCodeBaseSearch: (keyword: string) => void;
  handleProductSearch: (keyword: string) => void;
  
  // helpers
  parseSkuCodeBaseLabel: (label: string) => {
    brand_code: string;
    category_code: string;
  };
  
  // create SKU API
  createdResponse: ReturnType<typeof useCreateSkus>['data'];
  createError: ReturnType<typeof useCreateSkus>['error'];
  createSuccess: boolean;
  isCreating: boolean;
  submitCreateSkus: ReturnType<typeof useCreateSkus>['submit'];
  resetCreateSkus: ReturnType<typeof useCreateSkus>['reset'];
}

const useCreateSkuSharedLogic = (): CreateSkuSharedLogic => {
  const navigate = useNavigate();
  
  // ---------------------------------------------------------------------------
  // 1. Permissions
  // ---------------------------------------------------------------------------
  const { loading: permLoading, permissions } = usePermissions();
  const hasPermission = useHasPermission(permissions);
  
  const canCreateSku = useMemo(
    () => hasPermission(['create_skus']),
    [hasPermission],
  );
  
  // redirect if not allowed
  useEffect(() => {
    if (!permLoading && !canCreateSku) {
      navigate('/access-denied', { replace: true });
    }
  }, [permLoading, canCreateSku, navigate]);
  
  // ---------------------------------------------------------------------------
  // 2. Lookups
  // ---------------------------------------------------------------------------
  const skuCodeBase = useSkuCodeBaseLookup();
  const product = useProductLookup();
  
  const skuCodeBaseDropdown = createDropdownBundle();
  const productDropdown = createDropdownBundle();
  
  const { handleSkuCodeBaseSearch, handleProductSearch } =
    useSkuFormSearchHandlers({
      skuCodeBase,
      product,
    });
  
  // ---------------------------------------------------------------------------
  // 3. Create SKUs
  // ---------------------------------------------------------------------------
  const {
    data: createdResponse,
    loading: isCreating,
    error: createError,
    isSuccess: createSuccess,
    submit: submitCreateSkus,
    reset: resetCreateSkus,
  } = useCreateSkus();
  
  // ---------------------------------------------------------------------------
  // 4. Initial fetch + cleanup
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchLookups([
      { fetch: skuCodeBase.fetch, dropdown: skuCodeBaseDropdown },
      { fetch: product.fetch, dropdown: productDropdown },
    ]);
    
    return () => {
      resetLookups([
        { reset: skuCodeBase.reset },
        { reset: product.reset },
      ]);
      resetCreateSkus();
    };
  }, []);
  
  // ---------------------------------------------------------------------------
  // 5. Helper: parse label → brand/category
  // ---------------------------------------------------------------------------
  const parseSkuCodeBaseLabel = (label: string) => {
    if (!label) {
      return { brand_code: '', category_code: '' };
    }
    
    // "CH-HN (100)" → ["CH-HN", "(100)"]
    const [codePart] = label.split(' ');
    const [brand, cat] = (codePart ?? '').split('-');
    
    return {
      brand_code: brand ?? '',
      category_code: cat ?? '',
    };
  };
  
  return {
    // permissions
    permLoading,
    canCreateSku,
    
    // lookups
    skuCodeBase,
    product,
    
    // dropdown bundles
    skuCodeBaseDropdown,
    productDropdown,
    
    // search handlers
    handleSkuCodeBaseSearch,
    handleProductSearch,
    
    // helpers
    parseSkuCodeBaseLabel,
    
    // create SKU API
    createdResponse,
    createError,
    createSuccess,
    isCreating,
    submitCreateSkus,
    resetCreateSkus,
  };
};

export default useCreateSkuSharedLogic;
