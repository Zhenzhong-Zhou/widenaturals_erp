import { RootState } from '../../../store/store.ts';
import { UserResponse } from './userTypes.ts';

export const selectUserProfileResponse = (state: RootState): UserResponse | null => state.userProfile.response;
export const selectUserProfileLoading = (state: RootState): boolean => state.userProfile.loading ?? false;
export const selectUserProfileError = (state: RootState) => state.userProfile.error;
