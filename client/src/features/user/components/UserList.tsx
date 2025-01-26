import { FC } from 'react';
import { Box } from '@mui/material';
import { UsersCard } from '../index.ts';
import { UsersListProps } from '../state/userTypes.ts';
import { generateUniqueKey } from '@utils/generateUniqueKey.ts';

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
