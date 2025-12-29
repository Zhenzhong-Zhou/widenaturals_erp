import { FC, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import DetailsSection from '@components/common/DetailsSection';
import MetadataSection from '@components/common/MetadataSection';
import StatusChip from '@components/common/StatusChip';
import CustomTypography from '@components/common/CustomTypography';
import { PermissionDialog } from '@features/user/components/UserProfile';
import { useDialogFocusHandlers } from '@utils/hooks/useDialogFocusHandlers';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatGeneralStatus } from '@utils/formatters';
import type { FlattenedUserProfile } from '@features/user';

interface UserProfileDetailsProps {
  user: FlattenedUserProfile;
  lastLogin?: string | null;
}

const UserProfileDetails: FC<UserProfileDetailsProps> = ({
                                                           user,
                                                           lastLogin,
                                                         }) => {
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const permissionsButtonRef = useRef<HTMLButtonElement | null>(null);

  // Manage permission dialog open/close while preserving keyboard focus
  const {
    handleOpenDialog: openPermissionsDialogWithFocus,
    handleCloseDialog: closePermissionsDialogWithFocus,
  } = useDialogFocusHandlers(
    setShowPermissionsDialog,
    permissionsButtonRef,
    () => showPermissionsDialog
  );
  
  const {
    jobTitle,
    isSystem,
    avatarFormat,
    avatarUploadedAt,
    roleName,
    roleGroup,
    hierarchyLevel,
    permissions,
    statusName,
    statusDate,
    createdAt,
    createdByName,
    updatedAt,
    updatedByName,
  } = user;
  
  const formattedRoleName = formatLabel(roleName);
  
  return (
    <>
      {/* Business details */}
      <DetailsSection
        sectionTitle="User Details"
        fields={[
          { label: 'Job Title', value: jobTitle, format: formatLabel },
          { label: 'Role', value: formattedRoleName },
          { label: 'Role Group', value: roleGroup, format: formatLabel },
          { label: 'Hierarchy Level', value: hierarchyLevel },
          {
            label: 'Permissions',
            value: permissions.length,
            format: () => (
              <Box
                display="flex"
                alignItems="baseline"
                gap={0.5}
              >
                <CustomTypography variant="body2">
                  {permissions.length} permissions
                </CustomTypography>
                
                <Tooltip title="View permissions">
                  <IconButton
                    size="small"
                    ref={permissionsButtonRef}
                    onClick={openPermissionsDialogWithFocus}
                    sx={{
                      p: 0,
                      ml: 0.25,
                      verticalAlign: 'baseline',
                    }}
                  >
                    <InfoOutlined
                      fontSize="small"
                      sx={{ verticalAlign: 'middle' }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            ),
          },
          {
            label: 'System User',
            value: isSystem,
            format: () => (
              <StatusChip
                label={isSystem ? 'Yes' : 'No'}
                color={isSystem ? 'warning' : 'default'}
              />
            ),
          },
          { label: 'Status', value: statusName, format: formatGeneralStatus },
          { label: 'Status Date', value: statusDate, format: formatDateTime },
          { label: 'Last Login', value: lastLogin, format: formatDateTime },
        ]}
        columns={2}
      />
      
      {/* Permissions dialog */}
      <PermissionDialog
        open={showPermissionsDialog}
        onClose={closePermissionsDialogWithFocus}
        permissions={permissions}
        roleName={formattedRoleName}
      />
      
      {/* Audit */}
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          Audit Information
        </AccordionSummary>
        
        <AccordionDetails>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
            columnGap={3}
            rowGap={2}
          >
            <MetadataSection
              title={"Audit"}
              data={{
                createdAt: formatDateTime(createdAt),
                createdBy: createdByName,
                updatedAt: formatDateTime(updatedAt),
                updatedBy: updatedByName,
              }}
            />
            
            {(avatarFormat || avatarUploadedAt) && (
              <MetadataSection
                title="Avatar"
                data={{
                  'Image format': avatarFormat ?? '—',
                  'Uploaded at': avatarUploadedAt
                    ? formatDateTime(avatarUploadedAt)
                    : '—',
                }}
              />
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default UserProfileDetails;
