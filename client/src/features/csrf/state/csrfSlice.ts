import { createSlice } from '@reduxjs/toolkit';
import { getCsrfTokenThunk } from '@features/csrf/state/csrfThunk';

interface CsrfState {
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CsrfState = {
  token: null,
  status: 'idle',
  error: null,
};

const csrfSlice = createSlice({
  name: 'csrf',
  initialState,
  reducers: {
    /**
     * Clears CSRF state.
     * Intended for logout or full app reset only.
     */
    resetCsrfToken: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCsrfTokenThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getCsrfTokenThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload;
      })
      .addCase(getCsrfTokenThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to fetch CSRF token';
      });
  },
});

export const { resetCsrfToken } = csrfSlice.actions;
export default csrfSlice.reducer;
