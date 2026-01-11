import { createSlice } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import type { PermissionsState } from '@features/authorize';
import { fetchPermissionsThunk } from '@features/authorize';
import {
  invalidateSession,
  resetSession
} from '@features/session/state/sessionSlice';

const initialState: PermissionsState = {
  roleName: null,
  permissions: [],
  loading: false,
  error: null,
};

// Permission slice
const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    resetPermissions: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(resetSession, () => initialState)
      .addCase(invalidateSession, () => initialState)
      .addCase(REHYDRATE, (state) => {
        state.error = null;
        state.loading = false;
      })
      .addCase(fetchPermissionsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissionsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.roleName = action.payload.roleName;
        state.permissions = action.payload.permissions;
      })
      .addCase(fetchPermissionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ?? 'Failed to fetch permissions.';
      });
  },
});

export const { resetPermissions } = permissionSlice.actions;
export default permissionSlice.reducer;
