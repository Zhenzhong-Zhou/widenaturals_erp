import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/storeHooks";
import {
  selectError,
  selectLoading,
  selectPagination,
  selectProducts,
} from "../features/product/state/productSelectors";
import { fetchProducts } from "../features/product/state/productThunks";
import { UseProductsOptions, UseProductsResult } from '../features/product';

const useProducts = <T>({
                          initialPage = 1,
                          itemsPerPage = 10,
                     }: UseProductsOptions = {}): UseProductsResult<T> => {
  const dispatch = useAppDispatch();
  
  // Select data from Redux store
  const products = useAppSelector(selectProducts) as T[];
  const pagination = useAppSelector(selectPagination);
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  
  const fetchProductsByPage = async (page: number) => {
    try {
      await dispatch(
        fetchProducts({
          page,
          limit: itemsPerPage,
        })
      ).unwrap();
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };
  
  useEffect(() => {
    (async () =>{
      await fetchProductsByPage(initialPage); // Fetch products on initial render
    })();
  }, [dispatch, initialPage, itemsPerPage]);
  
  return {
    products,
    pagination,
    loading,
    error,
    fetchProductsByPage
  };
};

export default useProducts;
