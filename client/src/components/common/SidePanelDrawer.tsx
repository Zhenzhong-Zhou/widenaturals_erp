import { useEffect, type ReactNode, type RefObject } from 'react';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography.tsx';

interface SidePanelDrawerProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  anchor?: 'right' | 'left'; // default right
  width?: number | string; // default 400
  returnFocusRef?: RefObject<HTMLElement | null>;
}

const SidePanelDrawer = ({
                           open,
                           title,
                           children,
                           onClose,
                           anchor = 'right',
                           width = 400,
                           returnFocusRef,
                         }: SidePanelDrawerProps) => {
  
  // Restore focus only after the drawer has fully closed
  useEffect(() => {
    if (!open && returnFocusRef?.current) {
      // Use requestAnimationFrame to ensure DOM updates first
      requestAnimationFrame(() => {
        returnFocusRef.current?.focus();
      });
    }
  }, [open, returnFocusRef]);
  
  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      disableEnforceFocus
      disableRestoreFocus
      keepMounted
      ModalProps={{
        keepMounted: true,
      }}
      slotProps={{
        paper: {
          sx: {
            width,
            boxShadow: 3,
            borderLeft: anchor === 'right' ? '1px solid #ddd' : undefined,
            borderRight: anchor === 'left' ? '1px solid #ddd' : undefined,
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <CustomTypography variant="h6">{title ?? 'Details'}</CustomTypography>
        <IconButton
          onClick={(e) => {
            // Remove focus from the button immediately
            (e.currentTarget as HTMLElement).blur();
            
            // Trigger close
            onClose();
          }}
          aria-label="Close panel"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ px: 2, py: 2, overflowY: 'auto', height: '100%' }}>
        {children}
      </Box>
    </Drawer>
  );
};

export default SidePanelDrawer;
