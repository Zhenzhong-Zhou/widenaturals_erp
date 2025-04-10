import { FC } from 'react';
import Box from '@mui/material/Box';
import { UsersListProps } from '@features/user';
import UsersCard from '@features/user/components/UsersCard';
import { generateUniqueKey } from '@utils/generateUniqueKey';

const UsersList: FC<UsersListProps> = ({ users }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {users.map((user) => (
        <UsersCard
          key={generateUniqueKey(user, ['email', 'fullname'])} // Specify fields to use for the key
          user={user}
        />
      ))}
    </Box>
  );
};

export default UsersList;
