import type { FC, MouseEvent } from 'react';
import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { CustomButton, GoBackButton } from '@components/index';

interface DialogHandlers {
  handleOpenDialog: () => void;
}

interface Props {
  canUpdateMetadata: boolean;
  canUpdateStatus: boolean;
  canUpdateDimension: boolean;
  canUpdateIdentity: boolean;
  canUpdateImages: boolean;
  canUploadImages: boolean;

  metadataDialogHandlers: DialogHandlers;
  statusDialogHandlers: DialogHandlers;
  dimensionsDialogHandlers: DialogHandlers;
  identityDialogHandlers: DialogHandlers;
  imageDialogHandlers: DialogHandlers;
  uploadDialogHandlers: DialogHandlers;

  refresh: () => void;
  cameFromUpload: boolean;
}

const actionButtonStyle = {
  minWidth: 160,
  height: 44,
  borderRadius: 22,
};

/**
 * SkuDetailActionToolbar
 *
 * Action toolbar displayed on the SKU Detail page.
 *
 * Responsibilities
 * - Render action buttons related to SKU editing and image management
 * - Show contextual menus based on user permissions
 * - Trigger dialog handlers provided by the parent page
 *
 * Design notes
 * - Permission flags control which actions are visible
 * - Dialog logic remains in the parent page (handlers are injected)
 * - Menus are grouped to keep the toolbar compact
 *
 * Actions included
 * - Metadata update
 * - Dimension update
 * - Identity update
 * - Status update
 * - Image update / upload
 * - Page refresh
 * - Navigation back
 *
 * This component is purely presentational and contains no business logic.
 */
const SkuDetailActionToolbar: FC<Props> = ({
  canUpdateMetadata,
  canUpdateStatus,
  canUpdateDimension,
  canUpdateIdentity,
  canUpdateImages,
  canUploadImages,
  metadataDialogHandlers,
  statusDialogHandlers,
  dimensionsDialogHandlers,
  identityDialogHandlers,
  imageDialogHandlers,
  uploadDialogHandlers,
  refresh,
  cameFromUpload,
}) => {
  const [editAnchor, setEditAnchor] = useState<HTMLElement | null>(null);
  const [imageAnchor, setImageAnchor] = useState<HTMLElement | null>(null);

  const openEditMenu = (e: MouseEvent<HTMLElement>) => {
    setEditAnchor(e.currentTarget);
  };

  const openImageMenu = (e: MouseEvent<HTMLElement>) => {
    setImageAnchor(e.currentTarget);
  };

  const closeEditMenu = () => setEditAnchor(null);
  const closeImageMenu = () => setImageAnchor(null);

  return (
    <Stack
      direction="row"
      spacing={2}
      mt={3}
      mb={1}
      flexWrap="wrap"
      justifyContent="flex-end"
    >
      {/* EDIT MENU */}

      {(canUpdateMetadata ||
        canUpdateStatus ||
        canUpdateDimension ||
        canUpdateIdentity) && (
        <>
          <CustomButton
            sx={actionButtonStyle}
            color="secondary"
            onClick={openEditMenu}
          >
            Edit ▾
          </CustomButton>

          <Menu
            anchorEl={editAnchor}
            open={Boolean(editAnchor)}
            onClose={closeEditMenu}
          >
            {canUpdateMetadata && (
              <MenuItem
                onClick={() => {
                  metadataDialogHandlers.handleOpenDialog();
                  closeEditMenu();
                }}
              >
                Edit Metadata
              </MenuItem>
            )}

            {canUpdateDimension && (
              <MenuItem
                onClick={() => {
                  dimensionsDialogHandlers.handleOpenDialog();
                  closeEditMenu();
                }}
              >
                Edit Dimensions
              </MenuItem>
            )}

            {canUpdateIdentity && (
              <MenuItem
                onClick={() => {
                  identityDialogHandlers.handleOpenDialog();
                  closeEditMenu();
                }}
              >
                Edit Identity
              </MenuItem>
            )}

            {canUpdateStatus && (
              <MenuItem
                onClick={() => {
                  statusDialogHandlers.handleOpenDialog();
                  closeEditMenu();
                }}
              >
                Update SKU Status
              </MenuItem>
            )}
          </Menu>
        </>
      )}

      {/* IMAGE MENU */}

      {(canUpdateImages || canUploadImages) && (
        <>
          <CustomButton
            sx={actionButtonStyle}
            color="primary"
            onClick={openImageMenu}
          >
            Images ▾
          </CustomButton>

          <Menu
            anchorEl={imageAnchor}
            open={Boolean(imageAnchor)}
            onClose={closeImageMenu}
          >
            {canUpdateImages && (
              <MenuItem
                onClick={() => {
                  imageDialogHandlers.handleOpenDialog();
                  closeImageMenu();
                }}
              >
                Edit SKU Images
              </MenuItem>
            )}

            {canUploadImages && (
              <MenuItem
                onClick={() => {
                  uploadDialogHandlers.handleOpenDialog();
                  closeImageMenu();
                }}
              >
                Add Images
              </MenuItem>
            )}
          </Menu>
        </>
      )}

      {/* REFRESH */}

      <CustomButton sx={actionButtonStyle} onClick={refresh}>
        Refresh
      </CustomButton>

      {/* BACK */}

      <GoBackButton
        sx={actionButtonStyle}
        fallbackTo={cameFromUpload ? '/skus' : undefined}
      />
    </Stack>
  );
};

export default SkuDetailActionToolbar;
