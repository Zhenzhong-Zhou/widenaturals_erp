import type { FC } from 'react';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import {
  UserFilters,
  UserSortField,
} from '@features/user/state';
import {
  UserFiltersPanel,
  UserSortControls,
} from '@features/user/components/UserView';
import {
  UserFiltersPanelLookups,
  UserLookupHandlers
} from '@features/user/components/UserView/UserFiltersPanel';

interface UserFilterAndSortPanelProps {
  filters: UserFilters;
  /** Lookup data & state */
  lookups: UserFiltersPanelLookups;
  
  /** Lookup UI handlers */
  lookupHandlers: UserLookupHandlers;
  sortBy: UserSortField;
  sortOrder: '' | 'ASC' | 'DESC';
  
  onFiltersChange: (filters: UserFilters) => void;
  onSortByChange: (field: UserSortField) => void;
  onSortOrderChange: (order: '' | 'ASC' | 'DESC') => void;
  onReset: () => void;
}

const UserFilterAndSortPanel: FC<UserFilterAndSortPanelProps> = ({
                                                                   filters,
                                                                   lookups,
                                                                   lookupHandlers,
                                                                   sortBy,
                                                                   sortOrder,
                                                                   onFiltersChange,
                                                                   onSortByChange,
                                                                   onSortOrderChange,
                                                                   onReset,
                                                                 }) => {
  return (
    <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 9 }}>
          <UserFiltersPanel
            filters={filters}
            lookups={lookups}
            lookupHandlers={lookupHandlers}
            onChange={onFiltersChange}
            onApply={() => {}}
            onReset={onReset}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <UserSortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={onSortByChange}
            onSortOrderChange={onSortOrderChange}
          />
        </Grid>
      </Grid>
    </Card>
  );
};

export default UserFilterAndSortPanel;
