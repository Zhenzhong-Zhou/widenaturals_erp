import { createSlice } from '@reduxjs/toolkit';
import { fetchHealthStatus } from './healthStatusThunk.ts';
import { HealthState } from './HealthStatusState.ts';

const initialState: HealthState = {
  server: 'unknown',
  services: {
    database: { status: 'unknown' },
    pool: { status: 'unknown' },
  },
  timestamp: '',
};

// Slice for health state
const healthStatusSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthStatus.pending, (state) => {
        state.server = 'unknown';
        state.timestamp = '';
      })
      .addCase(fetchHealthStatus.fulfilled, (state, action) => {
        state.server = action.payload.server;
        state.services = action.payload.services;
        state.timestamp = action.payload.timestamp;
      })
      .addCase(fetchHealthStatus.rejected, (state) => {
        state.server = 'offline';
        state.services = {
          database: { status: 'offline' },
          pool: { status: 'offline' },
        };
        state.timestamp = new Date().toISOString(); // Set the current timestamp
      });
  },
});

export default healthStatusSlice.reducer;
