import { FC } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@components/index.ts';

interface PermissionListProps {
  permissions: string[];
}

const PermissionList: FC<PermissionListProps> = ({ permissions }) => (
  <Box component="ul" sx={{ pl: 2, mb: 3 }}>
    {permissions.map((permission) => (
      <Typography key={permission} component="li" variant="body2">
        {permission}
      </Typography>
    ))}
  </Box>
);

export default PermissionList;
