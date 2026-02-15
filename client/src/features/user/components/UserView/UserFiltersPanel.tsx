import { type FC, useEffect } from 'react';
import { Path, useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import type { UserFilters } from '@features/user/state';
import type { FilterField } from '@shared-types/shared';
import {
  useLookupSearchBinding,
  useMultiSelectBinding,
  useRoleSearchHandlers,
  useStatusSearchHandlers,
} from '@features/lookup/hooks';
import {
  RoleMultiSelectDropdown,
  StatusMultiSelectDropdown,
} from '@features/lookup/components';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';
import { renderDateField, renderInputField } from '@utils/filters/filterUtils';
import { formatLabel } from '@utils/textUtils';
import type {
  UserFiltersPanelLookups,
  UserLookupHandlers,
} from '@features/user/types/hookTypes';

interface Props {
  filters: UserFilters;

  /** Lookup data & state */
  lookups: UserFiltersPanelLookups;

  /** Lookup UI handlers */
  lookupHandlers: UserLookupHandlers;

  onChange: (filters: UserFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

/* ------------------------------------------------------------------ */
/* Empty defaults                                                      */
/* ------------------------------------------------------------------ */

const emptyFilters: UserFilters = {
  keyword: '',
  firstname: '',
  lastname: '',
  email: '',
  phoneNumber: '',
  jobTitle: '',
  roleIds: undefined,
  statusIds: undefined,
  dateRanges: undefined,
};

/* ------------------------------------------------------------------ */
/* Text fields                                                         */
/* ------------------------------------------------------------------ */

const TEXT_FIELDS: FilterField<UserFilters>[] = [
  { name: 'keyword', label: 'Keyword', placeholder: 'Name, Email, Phone…' },
  { name: 'firstname', label: 'First Name' },
  { name: 'lastname', label: 'Last Name' },
  { name: 'email', label: 'Email' },
  { name: 'phoneNumber', label: 'Phone Number' },
  { name: 'jobTitle', label: 'Job Title' },
];

/* ------------------------------------------------------------------ */
/* Date fields                                                         */
/* ------------------------------------------------------------------ */

interface UserDateField {
  name: Path<UserFilters>;
  label: string;
}

export const USER_DATE_FIELDS: UserDateField[] = [
  { name: 'dateRanges.created.from', label: 'Created Date ≥' },
  { name: 'dateRanges.created.to', label: 'Created Date <' },
  { name: 'dateRanges.updated.from', label: 'Updated Date ≥' },
  { name: 'dateRanges.updated.to', label: 'Updated Date <' },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const UserFiltersPanel: FC<Props> = ({
  filters,
  lookups,
  lookupHandlers,
  onChange,
  onApply,
  onReset,
}) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<UserFilters>({
      defaultValues: filters,
    });

  const { role, status } = lookups;

  /* -----------------------------
   * Sync external state
   * ----------------------------- */
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  /* -----------------------------
   * Submit / Reset
   * ----------------------------- */
  const submitFilters = (data: UserFilters) => {
    onChange(data);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };

  /* -----------------------------
   * Multi-select bindings
   * ----------------------------- */
  const {
    selectedOptions: selectedRoleOptions,
    handleSelect: handleRoleSelect,
  } = useMultiSelectBinding({
    watch,
    setValue,
    fieldName: 'roleIds',
    options: role.options,
  });

  const {
    selectedOptions: selectedStatusOptions,
    handleSelect: handleStatusSelect,
  } = useMultiSelectBinding({
    watch,
    setValue,
    fieldName: 'statusIds',
    options: status.options,
  });

  /* -----------------------------
   * Lookup search bindings
   * ----------------------------- */
  const { handleRoleSearch } = useRoleSearchHandlers(role);
  const { handleStatusSearch } = useStatusSearchHandlers(status);

  const roleSearch = useLookupSearchBinding(handleRoleSearch);
  const statusSearch = useLookupSearchBinding(handleStatusSearch);

  /* -----------------------------
   * Derived lookup options
   * ----------------------------- */
  const formattedRoleOptions = useFormattedOptions(role.options, formatLabel);

  const formattedStatusOptions = useFormattedOptions(
    status.options,
    formatLabel
  );

  /* -----------------------------
   * Render
   * ----------------------------- */
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          {/* ------------------------------------
           * Lookup filters
           * ------------------------------------ */}
          <Grid size={{ xs: 12, md: 6 }}>
            <RoleMultiSelectDropdown
              {...roleSearch}
              options={formattedRoleOptions}
              selectedOptions={selectedRoleOptions}
              onChange={handleRoleSelect}
              onOpen={lookupHandlers.onOpen.role}
              loading={role.loading}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <StatusMultiSelectDropdown
              {...statusSearch}
              options={formattedStatusOptions}
              selectedOptions={selectedStatusOptions}
              onChange={handleStatusSelect}
              onOpen={lookupHandlers.onOpen.status}
            />
          </Grid>

          {/* ------------------------------------
           * Text filters
           * ------------------------------------ */}
          {TEXT_FIELDS.map(({ name, label, placeholder }) =>
            renderInputField(control, name, label, placeholder)
          )}

          {/* ------------------------------------
           * Date range filters
           * ------------------------------------ */}
          {USER_DATE_FIELDS.map(({ name, label }) =>
            renderDateField(control, name, label)
          )}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default UserFiltersPanel;
