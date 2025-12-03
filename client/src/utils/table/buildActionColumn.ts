import type { MiniColumn } from '@components/common/CustomMiniTable';
import { type ActionConfig, renderActionIcons } from './renderActionIcons';

export const buildActionColumn = <T extends object>(
  getActions: (row: T) => ActionConfig<T>[]
): MiniColumn<T> => ({
  id: 'actions',
  label: '',
  align: 'center',
  renderCell: (row) => {
    const actions = getActions(row).filter(Boolean);
    return renderActionIcons(row, actions);
  },
});
