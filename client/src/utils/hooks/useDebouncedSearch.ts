import { useCallback, useEffect, useRef } from 'react';
import { debounce, type DebouncedFunc } from 'lodash';

type SearchHandler = (keyword: string) => void;

/**
 * Provides a debounced keyword search handler.
 *
 * @param fetchFn - A function that accepts { keyword, ... } object
 * @param staticParams
 * @param delay - Debounce delay in ms (default: 400)
 */
const useDebouncedSearch = <T extends Record<string, any>>(
  fetchFn: (params: T) => void,
  staticParams?: Omit<T, 'keyword'>,
  delay = 400
): SearchHandler => {
  const debouncedFetchRef = useRef<DebouncedFunc<
    (keyword: string) => void
  > | null>(null);

  useEffect(() => {
    debouncedFetchRef.current = debounce((keyword: string) => {
      fetchFn({ keyword, ...staticParams } as unknown as T);
    }, delay);

    return () => {
      debouncedFetchRef.current?.cancel();
    };
  }, [fetchFn, staticParams, delay]);

  return useCallback((keyword: string) => {
    debouncedFetchRef.current?.(keyword);
  }, []);
};

export default useDebouncedSearch;
