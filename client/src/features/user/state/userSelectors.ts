import { RootState } from '../../../store/store.ts';
import { User } from './userTypes';

export const selectUsers = (state: RootState): User[] => state.users.users;
export const selectUsersLoading = (state: RootState): boolean => state.users.loading;
export const selectUsersError = (state: RootState): string | null => state.users.error;
