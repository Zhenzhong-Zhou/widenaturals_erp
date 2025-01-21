import { RootState } from '../../../store/store.ts';
import { UserResponse } from './userTypes.ts';

export const selectUserResponse = (state: RootState): UserResponse | null => state.user.response;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;
