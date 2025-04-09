import userProfileReducer from './userProfileSlice';
import usersReducer from './userSlice';

export const userReducers = {
  userProfile: userProfileReducer,
  users: usersReducer,
};
