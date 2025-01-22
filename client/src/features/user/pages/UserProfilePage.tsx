import { FC, useState } from 'react';
import { CustomButton, DetailHeader, DetailPage, MetadataSection } from '@components/index.ts';
import { useAppSelector } from '../../../store/storeHooks.ts';
import { selectUserLoading, selectUserResponse } from '../state/userSelectors.ts';
import { selectLastLogin } from '../../session/state/sessionSelectors.ts';
import { formatDate, formatDateTime} from '@utils/dateTimeUtils.ts';
import { ResetPasswordModal } from '../../resetPassword';
import { resetPasswordService } from '../../../services';

const UserProfilePage: FC = () => {
  const response = useAppSelector(selectUserResponse);
  const lastLogin = useAppSelector(selectLastLogin);
  const loading = useAppSelector(selectUserLoading);
  const user = response?.data;
  const [isModalOpen, setModalOpen] = useState(false);
  
  const metadata = {
    'Role': user?.role || 'N/A',
    'Job Title': user?.job_title || 'N/A',
    'Phone': user?.phone_number || 'N/A',
    'Last Login': lastLogin ? formatDateTime(lastLogin) : 'N/A',
    'Created At': user?.created_at ? formatDate(user?.created_at) : 'N/A',
    'Updated At': user?.updated_at ? formatDate(user?.updated_at) : 'N/A',
  };
  
  const handleResetPassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      // Destructure fields from the data object
      const { currentPassword, newPassword } = data;
      
      // Call the reset password service
      const {success, message, timestamp} = await resetPasswordService.resetPassword(currentPassword, newPassword);
      
      // Handle success response
      if (success) {
        console.log(message, timestamp);
        setModalOpen(false); // Close the modal
      } else {
        console.error('Failed to reset password:', message);
      }
    } catch (error) {
      // Handle errors (e.g., network issues, validation failures)
      console.error('Error resetting password:', error);
    }
  };
  
  return (
    <DetailPage title="User Profile" isLoading={loading} error={user ? undefined : 'No user information available'}>
      {user && (
        <>
          <DetailHeader
            avatarSrc={''} // Replace with actual avatar URL if available
            avatarFallback={user.firstname?.charAt(0).toUpperCase()}
            name={`${user.firstname} ${user.lastname}`}
            subtitle={user.email}
          />
          <MetadataSection data={metadata} />
          <CustomButton onClick={() => setModalOpen(true)}>Reset Password</CustomButton>
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
