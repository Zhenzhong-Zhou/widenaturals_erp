import paginatedUsersReducer from './paginatedUsersSlice';
import userProfileReducer from './userProfileSlice';

export const userReducers = {
  paginatedUsers: paginatedUsersReducer,
  userProfile: userProfileReducer,
};