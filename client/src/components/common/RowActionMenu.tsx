import { useState, type MouseEvent, type ReactNode, type RefObject } from 'react';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export interface RowActionItem<T = any> {
  label: string;
  onClick: (row: T) => void;
  icon?: ReactNode;
  disabled?: boolean;
  buttonRef?: RefObject<HTMLElement>; // optional ref for a11y focus mgmt
}

interface RowActionMenuProps<T = any> {
  row: T;
  actions: RowActionItem<T>[];
  buttonAriaLabel?: string;
}

const RowActionMenu = <T,>({
                             row,
                             actions,
                             buttonAriaLabel = 'Row actions',
                           }: RowActionMenuProps<T>) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent row clicks
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => setAnchorEl(null);
  
  return (
    <>
      <IconButton onClick={handleOpen} aria-label={buttonAriaLabel} size="small">
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              action.onClick(row);
              handleClose();
              
              // If a ref is provided, manually set focus for accessibility
              if (action.buttonRef?.current) {
                setTimeout(() => {
                  action.buttonRef?.current?.focus();
                }, 0);
              }
            }}
            disabled={action.disabled}
          >
            {action.icon && <span style={{ marginRight: 8 }}>{action.icon}</span>}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default RowActionMenu;
