import { createSlice } from '@reduxjs/toolkit';
import { HealthState } from '@features/health/state/healthStatusState';
import { fetchHealthStatus } from '@features/health/state/healthStatusThunk';

const initialState: HealthState = {
  server: 'unknown',
  services: {
    database: { status: 'unknown' },
    pool: { status: 'unknown' },
  },
  timestamp: '',
  loading: false, // Initial loading state
  error: null,
};

// Slice for health state
const healthStatusSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthStatus.pending, (state) => {
        state.loading = true; // Set loading to true
        state.server = 'unknown';
        state.timestamp = '';
        state.error = null;
      })
      .addCase(fetchHealthStatus.fulfilled, (state, action) => {
        state.loading = false; // Set loading to false
        state.server = action.payload.server;
        state.services = action.payload.services;
        state.timestamp = action.payload.timestamp;
        state.error = null; // Clear any previous error
      })
      .addCase(fetchHealthStatus.rejected, (state, action) => {
        state.loading = false; // Set loading to false
        state.server = 'offline';
        state.services = {
          database: { status: 'offline' },
          pool: { status: 'offline' },
        };
        state.timestamp = new Date().toISOString(); // Set the current timestamp
        state.error = action.payload || 'An unknown error occurred'; // Set the error message
      });
  },
});

export default healthStatusSlice.reducer;
