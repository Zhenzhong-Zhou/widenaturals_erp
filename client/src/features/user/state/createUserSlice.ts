import { createSlice } from '@reduxjs/toolkit';
import { CreateUserState } from '@features/user';
import { createUserThunk } from '@features/user';
import { extractErrorMessage } from '@utils/error';

/**
 * Factory for initial create-user state.
 *
 * Notes:
 * - `data` is null until a user is successfully created
 * - State represents a WRITE mutation, not cached user data
 */
const createInitialState = (): CreateUserState => ({
  data: null,
  loading: false,
  error: null,
});

/**
 * createUserSlice
 *
 * Manages async state for the POST /users operation.
 *
 * Responsibilities:
 * - Track request lifecycle (loading / success / failure)
 * - Store the newly created user summary on success
 * - Expose a reset action for form and UI cleanup
 *
 * MUST NOT:
 * - Perform business or domain logic
 * - Cache or normalize user collections
 * - Be reused for update or delete operations
 */
const createUserSlice = createSlice({
  name: 'createUser',
  initialState: createInitialState(),
  reducers: {
    /**
     * Reset create-user state.
     *
     * Intended for:
     * - Form unmount
     * - Successful submission cleanup
     * - Manual retry flows
     */
    resetCreateUserState: () => createInitialState(),
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(createUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = extractErrorMessage(action.payload);
      });
  },
});

export const { resetCreateUserState } = createUserSlice.actions;
export default createUserSlice.reducer;
