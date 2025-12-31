import { type FC, useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { selectLastLogin } from '@features/session/state';
import { clearTokens } from '@utils/auth';
import useLogout from '@hooks/useLogout';
import usePagePermissionGuard from '@features/authorize/hooks/usePagePermissionGuard';
import { resetPasswordThunk } from '@features/resetPassword';
import {
  useUserSelfProfile,
  useUserViewedProfile,
  useUserViewedProfileAuto,
} from '@hooks/index';
import { flattenUserProfile } from '@features/user/utils/flattenUserProfile';
import DetailPage from '@components/common/DetailPage';
import DetailHeader from '@components/common/DetailHeader';
import CustomButton from '@components/common/CustomButton';
import GoBackButton from '@components/common/GoBackButton';
import NoDataFound from '@components/common/NoDataFound';
import { UserProfileDetails } from '@features/user/components/UserProfile';
import ResetPasswordModal from '@features/resetPassword/components/ResetPasswordModal';
import { USER_DEFAULT_PLACEHOLDER } from '@utils/constants/assets';

const UserProfilePage: FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const lastLogin = useAppSelector(selectLastLogin);
  const [isModalOpen, setModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { isLoading: isLogoutLoading } = useLogout();
  
  const {
    isAllowed: canChangeOwnPassword,
    permLoading,
  } = usePagePermissionGuard([
    'user.password.change.self',
  ]);
  
  const {
    isAllowed: canResetOthersPassword,
  } = usePagePermissionGuard([
    'user.password.reset.any',
    'user.password.force_reset.any',
  ]);
  
  // ----------------------------
  // SELF PROFILE (My Profile)
  // ----------------------------
  const selfProfile = useUserSelfProfile();
  
  // ----------------------------
  // VIEWED PROFILE (HR/Admin)
  // ----------------------------
  const viewedProfile = useUserViewedProfile();

  // Auto-fetch only when viewing another user (HR/Admin context)
  useUserViewedProfileAuto(userId ?? null);
  
  // ----------------------------
  // Decide which profile to use
  // ----------------------------
  const isViewingSelf = !userId;
  
  // ----------------------------
  // Normalize refresh action
  // ----------------------------
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
  
  // Select profile source based on route context
  const {
    profile: userProfile,
    fullName,
    email,
    isSystem,
    loading: isProfileLoading,
    error: profileError,
    isLoadingEmpty: isInitialProfileLoading,
  } = isViewingSelf ? selfProfile : viewedProfile;
  
  const isOwnProfile = isViewingSelf;
  
  // ----------------------------
  // Derived data
  // ----------------------------
  const flattenedUserProfile = useMemo(
    () => (userProfile ? flattenUserProfile(userProfile) : null),
    [userProfile]
  );
  
  const avatarSrc = flattenedUserProfile?.avatarUrl ?? USER_DEFAULT_PLACEHOLDER;
  
  /**
   * Handles the password reset process and triggers a logout on success.
   */
  const handleResetPassword = async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      const { success, message } = await dispatch(
        resetPasswordThunk(data)
      ).unwrap();

      if (success) {
        setModalOpen(false);

        clearTokens();
        localStorage.clear();
        sessionStorage.clear();

        console.log('Redirecting to login after password reset...');
        window.location.href = '/login';
      } else {
        console.error('Password reset failed:', message);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };
  
  return (
    <DetailPage
      title="User Profile"
      isLoading={isProfileLoading || isLogoutLoading}
      error={profileError}
      sx={{ maxWidth: 1100 }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
      <GoBackButton/>
        
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
            subtitle={email}
          />
          
          <UserProfileDetails
            user={flattenedUserProfile}
            lastLogin={lastLogin}
          />
          
          {!isSystem &&
            !permLoading &&
            (
              // Regular user: own profile only
              (isOwnProfile && canChangeOwnPassword) ||
              
              // Privileged user: can reset others
              (!isOwnProfile && canResetOthersPassword)
            ) && (
            <CustomButton sx={{ mt: 3 }} onClick={() => setModalOpen(true)}>
              {isOwnProfile ? 'Change Password' : 'Reset Password'}
            </CustomButton>
          )}
          
          {isModalOpen && (
            <ResetPasswordModal
              open={isModalOpen}
              onClose={() => setModalOpen(false)}
              onSubmit={handleResetPassword}
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
