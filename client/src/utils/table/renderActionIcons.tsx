import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

export interface ActionConfig<RowType> {
  key: string;
  title: string;
  icon: ReactNode;
  onClick?: (row: RowType, target: HTMLElement) => void;
}

export const renderActionIcons = <RowType extends object>(
  row: RowType,
  actions: ActionConfig<RowType>[]
) => (
  <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center' }}>
    {actions.map((action) => (
      <Tooltip key={action.key} title={action.title}>
        <IconButton
          size="small"
          onClick={(e) => action.onClick?.(row, e.currentTarget)}
        >
          {action.icon}
        </IconButton>
      </Tooltip>
    ))}
  </Box>
);
