import { type FC, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectUserProfileLoading,
  selectUserProfileResponse,
} from '@features/user';
import { selectLastLogin } from '@features/session/state';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import { clearTokens } from '@utils/tokenManager';
import useLogout from '@hooks/useLogout';
import { resetPasswordThunk } from '@features/resetPassword';
import DetailPage from '@components/common/DetailPage';
import DetailHeader from '@components/common/DetailHeader';
import MetadataSection from '@components/common/MetadataSection';
import CustomButton from '@components/common/CustomButton';
import ResetPasswordModal from '@features/resetPassword/components/ResetPasswordModal';

const UserProfilePage: FC = () => {
  const response = useAppSelector(selectUserProfileResponse);
  const lastLogin = useAppSelector(selectLastLogin);
  const loading = useAppSelector(selectUserProfileLoading);
  const user = response?.data;
  const [isModalOpen, setModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { isLoading: isLogoutLoading } = useLogout();

  const metadata = {
    Role: user?.role || 'N/A',
    'Job Title': user?.job_title || 'N/A',
    Phone: user?.phone_number || 'N/A',
    'Last Login': lastLogin ? formatDateTime(lastLogin) : 'N/A',
    'Created At': user?.created_at ? formatDate(user?.created_at) : 'N/A',
    'Updated At': user?.updated_at ? formatDate(user?.updated_at) : 'N/A',
  };

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
      isLoading={loading || isLogoutLoading} // Show a loading spinner during logout
      error={user ? undefined : 'No user information available'}
    >
      {user && (
        <>
          <DetailHeader
            avatarSrc={''} // Replace it with actual avatar URL if available
            avatarFallback={user.firstname?.charAt(0).toUpperCase()}
            name={`${user.firstname} ${user.lastname}`}
            subtitle={user.email}
          />
          <MetadataSection data={metadata} />
          <CustomButton onClick={() => setModalOpen(true)}>
            Reset Password
          </CustomButton>
          {isModalOpen && (
            <ResetPasswordModal
              open={isModalOpen}
              onClose={() => setModalOpen(false)}
              onSubmit={handleResetPassword}
            />
          )}
        </>
      )}
    </DetailPage>
  );
};

export default UserProfilePage;
