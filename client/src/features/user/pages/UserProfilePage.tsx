import { FC } from 'react';
import { DetailHeader, DetailPage, MetadataSection } from '@components/index.ts';
import { useAppSelector } from '../../../store/storeHooks.ts';
import { selectUserLoading, selectUserResponse } from '../state/userSelectors.ts';
import { selectLastLogin } from '../../session/state/sessionSelectors.ts';
import { formatDate, formatDateTime} from '@utils/dateTimeUtils.ts';

const UserProfilePage: FC = () => {
  const response = useAppSelector(selectUserResponse);
  const lastLogin = useAppSelector(selectLastLogin);
  const loading = useAppSelector(selectUserLoading);
  const user = response?.data;
  
  const metadata = {
    'Role': user?.role || 'N/A',
    'Job Title': user?.job_title || 'N/A',
    'Phone': user?.phone_number || 'N/A',
    'Last Login': lastLogin ? formatDateTime(lastLogin) : 'N/A',
    'Created At': user?.created_at ? formatDate(user?.created_at) : 'N/A',
    'Updated At': user?.updated_at ? formatDate(user?.updated_at) : 'N/A',
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
        </>
      )}
    </DetailPage>
  );
};

export default UserProfilePage;
