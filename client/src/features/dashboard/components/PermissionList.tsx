import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';

interface PermissionListProps {
  permissions: string[];
}

const PermissionList: FC<PermissionListProps> = ({ permissions }) => (
  <Box component="ul" sx={{ pl: 2, mb: 3 }}>
    {permissions?.map((permission) => (
      <CustomTypography key={permission} component="li" variant="body2">
        {permission}
      </CustomTypography>
    ))}
  </Box>
);

export default PermissionList;
