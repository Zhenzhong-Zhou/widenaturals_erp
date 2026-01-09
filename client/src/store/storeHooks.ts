import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed Redux hooks.
 *
 * Purpose:
 * - Provide strongly typed versions of `useDispatch` and `useSelector`
 *   for use throughout the application.
 *
 * Architectural role:
 * - Enforces correct typing for both runtime and persisted state access.
 * - Prevents accidental use of untyped Redux hooks.
 *
 * Usage rules:
 * - Always use `useAppDispatch` instead of `useDispatch`
 * - Always use `useAppSelector` instead of `useSelector`
 *
 * Benefits:
 * - Full type inference for selectors
 * - Compile-time safety for dispatching actions
 * - Cleaner component code with no manual generics
 */

export const useAppDispatch = () => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
