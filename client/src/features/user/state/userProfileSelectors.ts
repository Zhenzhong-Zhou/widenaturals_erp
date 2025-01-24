import { RootState } from '../../../store/store.ts';
import { UserProfileResponse } from './userTypes.ts';

export const selectUserProfileResponse = (state: RootState): UserProfileResponse | null => state.userProfile.response;
export const selectUserProfileLoading = (state: RootState): boolean => state.userProfile.loading ?? false;
export const selectUserProfileError = (state: RootState) => state.userProfile.error;
