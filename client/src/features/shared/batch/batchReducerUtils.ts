import type { UiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Minimal structural contract required for batch success workflows.
 *
 * Any slice state matching this shape is compatible.
 *
 * @template TResponse - Full API response payload type
 * @template TResult - Individual result row type
 * @template TStats - Optional statistics/summary type
 */
export interface BatchWorkflowState<
  TResponse,
  TResult = unknown,
  TStats = unknown
> {
  loading: boolean;
  error: UiErrorPayload | null;
  data: TResponse | null;
  results: TResult[] | null;
  stats: TStats | null;
}

/**
 * Applies standardized batch success transition.
 *
 * ✔ Resets `loading`
 * ✔ Clears previous `error`
 * ✔ Stores full response payload in `data`
 * ✔ Extracts `results` and `stats` if present
 *
 * Designed for:
 * - Bulk create/update operations
 * - Batch processing endpoints
 * - Workflows returning result arrays + summary metadata
 *
 * This function is fully structural and works with any slice state
 * that matches {@link BatchWorkflowState}.
 *
 * @template TState - Slice state type extending BatchWorkflowState
 * @template TResponse - Full response type
 * @template TResult - Result row type
 * @template TStats - Statistics type
 *
 * @param state - Slice state to mutate
 * @param payload - Fulfilled thunk payload
 */
export const applyBatchSuccess = <
  TResponse,
  TResult = unknown,
  TStats = unknown,
  TState extends BatchWorkflowState<TResponse, TResult, TStats> = BatchWorkflowState<
    TResponse,
    TResult,
    TStats
  >
>(
  state: TState,
  payload: TResponse & {
    data?: TResult[];
    stats?: TStats;
  }
) => {
  state.loading = false;
  state.error = null;
  
  state.data = payload;
  state.results = payload.data ?? null;
  state.stats = payload.stats ?? null;
};
