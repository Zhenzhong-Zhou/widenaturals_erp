import type { FC } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import CustomDialog from '@components/common/CustomDialog';
import CustomTypography from '@components/common/CustomTypography';
import { useThemeContext } from '@context/ThemeContext';

interface PermissionDialogProps {
  open: boolean;
  onClose: () => void;
  permissions: string[];
  roleName?: string | null;
}

const PermissionDialog: FC<PermissionDialogProps> = ({
  open,
  onClose,
  permissions,
  roleName,
}) => {
  const { theme } = useThemeContext();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Split permissions into 1–2 columns depending on screen size and list length
  const columnCount = isSmallScreen || permissions.length <= 10 ? 1 : 2;

  const columns = Array.from({ length: columnCount }, (_, colIndex) =>
    permissions.filter((_, index) => index % columnCount === colIndex)
  );

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={`Permissions${roleName ? ` — ${roleName}` : ''}`}
      showCancelButton
    >
      <Box>
        <CustomTypography
          variant="body2"
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          This user has {permissions.length} permissions assigned.
        </CustomTypography>

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          <Grid container spacing={2}>
            {columns.map((column, idx) => (
              <Grid size={{ xs: 12, md: 6 }} key={idx}>
                <List dense>
                  {column.map((permission) => (
                    <ListItem key={permission} disableGutters>
                      <ListItemText
                        primary={permission}
                        slotProps={{
                          primary: {
                            variant: 'body2',
                            color: 'text.secondary',
                            fontFamily: 'monospace',
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </CustomDialog>
  );
};

export default PermissionDialog;
