import { createSlice } from '@reduxjs/toolkit';
import { fetchPermissionsThunk } from '@features/authorize/state/authorizeThunk';

// Initial state
export interface PermissionsState {
  roleName: string;
  permissions: string[];
  loading: boolean;
  error: string | null;
}

const initialState: PermissionsState = {
  roleName: '',
  permissions: [],
  loading: false,
  error: null,
};

// Permission slice
const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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

export default permissionSlice.reducer;
