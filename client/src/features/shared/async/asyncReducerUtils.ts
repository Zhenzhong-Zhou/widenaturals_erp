import type { PayloadAction, SerializedError } from '@reduxjs/toolkit';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { ErrorType } from '@utils/error';

/**
 * Strongly typed rejected async thunk action.
 *
 * Represents the `.rejected` action produced by `createAsyncThunk`
 * when using `{ rejectValue: UiErrorPayload }`.
 *
 * - `payload` exists when `rejectWithValue` was used.
 * - `error` contains serialized error data when a normal throw occurred.
 */
export type RejectedThunkAction = PayloadAction<
  UiErrorPayload | undefined,
  string,
  any,
  SerializedError
>;

/**
 * Applies standardized rejected-state handling for async thunks.
 *
 * ✔ Resets `loading` to `false`
 * ✔ Ensures `error` is always a structured {@link UiErrorPayload}
 * ✔ Supports both `rejectWithValue` and thrown errors
 *
 * Behavior:
 * - If the thunk used `rejectWithValue`, `action.payload` is used directly.
 * - If the thunk threw an error, falls back to a normalized
 *   {@link UiErrorPayload} using `action.error.message`.
 * - If no message exists, `fallbackMessage` is used.
 *
 * Intended usage:
 * - Inside Redux slice `extraReducers`
 * - For handling `.rejected` cases consistently
 *
 * Example:
 * ```ts
 * builder.addCase(fetchUsersThunk.rejected, (state, action) => {
 *   applyRejected(state, action, 'Failed to fetch users.');
 * });
 * ```
 *
 * @param state - Slice state containing `loading` and `error` fields.
 * @param action - Rejected async thunk action.
 * @param fallbackMessage - Default message if no error message is available.
 */
export const applyRejected = (
  state: { loading: boolean; error: UiErrorPayload | null },
  action: RejectedThunkAction,
  fallbackMessage: string
) => {
  state.loading = false;
  
  state.error =
    action.payload ??
    {
      message: action.error?.message ?? fallbackMessage,
      type: ErrorType.Unknown,
    };
};
