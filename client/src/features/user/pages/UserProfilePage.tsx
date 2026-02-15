import { type FC, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppSelector } from '@store/storeHooks';
import { selectLastLogin } from '@features/session/state';
import {
  useChangePassword,
  useLogout,
  useUserSelfProfile,
  useUserViewedProfile,
  useUserViewedProfileAuto,
} from '@hooks/index';
import { usePagePermissionState } from '@features/authorize/hooks';
import { useModalFocusHandlers } from '@utils/hooks';
import { flattenUserProfile } from '@features/user/utils/flattenUserProfile';
import { UserProfileDetails } from '@features/user/components/UserProfile';
import { ChangePasswordModal } from '@features/auth/password/components';
import {
  CustomButton,
  DetailHeader,
  DetailPage,
  GoBackButton,
  Loading,
  NoDataFound,
} from '@components/index';
import { USER_DEFAULT_PLACEHOLDER } from '@utils/constants/assets';
import type { PasswordUpdateSubmitData } from '@features/auth/password/components/ChangePasswordForm';

/**
 * UserProfilePage
 *
 * Responsibilities:
 * - Display current user's profile (self view)
 * - Display another user's profile (admin/HR view)
 * - Handle authenticated password change workflow
 *
 * Security Behavior:
 * - Own profile → requires `change_self_password`
 * - Other profile → requires reset permissions
 *
 * On successful password change:
 * - Displays confirmation
 * - Logs user out after short delay
 *
 * This page is a feature-level container.
 * UI logic is delegated to hooks and feature components.
 */
const UserProfilePage: FC = () => {
  // ----------------------------------------
  // Route Params
  // ----------------------------------------
  const { userId } = useParams<{ userId?: string }>();

  // ----------------------------------------
  // Global Selectors
  // ----------------------------------------
  const lastLogin = useAppSelector(selectLastLogin);

  // ----------------------------------------
  // Feature Hooks
  // ----------------------------------------
  const { loading, error, success, changedAt, changePassword, reset } =
    useChangePassword();

  const { logout } = useLogout();

  const { open, triggerRef, handleOpen, handleClose } = useModalFocusHandlers();

  // ----------------------------------------
  // Permission Checks
  // ----------------------------------------
  const { isAllowed: canChangeOwnPassword } = usePagePermissionState(
    'change_self_password'
  );

  const { isAllowed: canResetOthersPassword } = usePagePermissionState([
    'reset_any_user_password',
    'force_reset_any_user_password',
  ]);

  // ----------------------------------------
  // Profile Data Hooks
  // ----------------------------------------
  const selfProfile = useUserSelfProfile();
  const viewedProfile = useUserViewedProfile();

  // Auto-fetch when viewing another user
  useUserViewedProfileAuto(userId ?? null);

  // ----------------------------------------
  // View Context
  // ----------------------------------------
  const isViewingSelf = !userId;
  const isOwnProfile = isViewingSelf;

  const profileSource = isViewingSelf ? selfProfile : viewedProfile;

  const {
    profile: userProfile,
    fullName,
    email,
    isSystem,
    loading: isProfileLoading,
    error: profileError,
    isLoadingEmpty: isInitialProfileLoading,
  } = profileSource;

  // ----------------------------------------
  // Derived Data
  // ----------------------------------------
  const flattenedUserProfile = useMemo(
    () => (userProfile ? flattenUserProfile(userProfile) : null),
    [userProfile]
  );

  const avatarSrc = flattenedUserProfile?.avatarUrl ?? USER_DEFAULT_PLACEHOLDER;

  // ----------------------------------------
  // Handlers
  // ----------------------------------------

  /**
   * Dispatch password change request.
   * Modal stays open until success.
   */
  const handleResetPassword = (data: PasswordUpdateSubmitData) => {
    changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  /**
   * Refresh profile depending on view context.
   */
  const refreshProfile = useCallback(() => {
    if (isViewingSelf) {
      selfProfile.fetchSelfProfile();
    } else if (userId) {
      viewedProfile.fetchViewedProfile(userId);
    }
  }, [
    isViewingSelf,
    userId,
    selfProfile.fetchSelfProfile,
    viewedProfile.fetchViewedProfile,
  ]);

  // ----------------------------------------
  // Side Effects
  // ----------------------------------------

  /**
   * After successful password change:
   * - Delay briefly for UX feedback
   * - Reset slice state
   * - Trigger logout (server + redirect)
   */
  useEffect(() => {
    if (!success) return;

    const timeout = setTimeout(async () => {
      reset();
      await logout();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [success, reset, logout]);

  // ----------------------------------------
  // Loading Guard
  // ----------------------------------------
  if (!fullName) {
    return <Loading variant="dotted" message="Loading profile..." />;
  }

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <DetailPage
      title="User Profile"
      isLoading={isProfileLoading}
      error={profileError}
      sx={{ maxWidth: 1100 }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <GoBackButton />

        <CustomButton
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshProfile}
        >
          Refresh
        </CustomButton>
      </Box>

      {flattenedUserProfile ? (
        <>
          <DetailHeader
            avatarSrc={avatarSrc}
            avatarFallback={fullName?.charAt(0)}
            name={fullName}
            subtitle={email ?? undefined}
          />

          <UserProfileDetails
            user={flattenedUserProfile}
            lastLogin={lastLogin}
          />

          {!isSystem &&
            ((isOwnProfile && canChangeOwnPassword) ||
              (!isOwnProfile && canResetOthersPassword)) && (
              <CustomButton
                ref={triggerRef}
                sx={{ mt: 3 }}
                onClick={handleOpen}
              >
                {isOwnProfile ? 'Change Password' : 'Reset Password'}
              </CustomButton>
            )}

          {open && (
            <ChangePasswordModal
              open={open}
              onClose={handleClose}
              onSubmit={handleResetPassword}
              success={success}
              loading={loading}
              changedAt={changedAt}
              error={error}
            />
          )}
        </>
      ) : !isInitialProfileLoading ? (
        <NoDataFound message="No user profile found." />
      ) : null}
    </DetailPage>
  );
};

export default UserProfilePage;
