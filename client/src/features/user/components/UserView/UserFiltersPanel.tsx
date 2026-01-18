import { type FC, useEffect } from 'react';
import { Path, useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import FilterPanelLayout from '@components/common/FilterPanelLayout';
import { renderDateField, renderInputField } from '@utils/filters/filterUtils';
import type { FilterField } from '@shared-types/shared';
import type { UserFilters } from '@features/user/state';
// import useRoleLookup from '@hooks/useRoleLookup';
import useStatusLookup from '@hooks/useStatusLookup';
import { useMultiSelectBinding } from '@features/lookup/hooks';
import StatusMultiSelectDropdown from '@features/lookup/components/StatusMultiSelectDropdown';
// import RoleMultiSelectDropdown from '@features/lookup/components/RoleMultiSelectDropdown';
import { formatLabel } from '@utils/textUtils';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';

/* ------------------------------------------------------------------ */
/* Interfaces                                                          */
/* ------------------------------------------------------------------ */

export interface UserFiltersPanelLookups {
  // role: ReturnType<typeof useRoleLookup>;
  status: ReturnType<typeof useStatusLookup>;
}

export interface UserLookupHandlers {
  onOpen: {
    // role: () => void;
    status: () => void;
  };
}

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
  { name: 'dateRanges.created.to', label: 'Created Date ≤' },
  { name: 'dateRanges.updated.from', label: 'Updated Date ≥' },
  { name: 'dateRanges.updated.to', label: 'Updated Date ≤' },
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

  const {
    // role,
    status,
  } = lookups;

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
  // const {
  //   selectedOptions: selectedRoleOptions,
  //   handleSelect: handleRoleSelect,
  // } = useMultiSelectBinding({
  //   watch,
  //   setValue,
  //   fieldName: 'roleIds',
  //   options: role.options,
  // });

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
   * Derived lookup options
   * ----------------------------- */
  // const formattedRoleOptions = useFormattedOptions(
  //   role.options,
  //   formatLabel
  // );

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
          {/*<Grid size={{ xs: 12, md: 4 }}>*/}
          {/*  <RoleMultiSelectDropdown*/}
          {/*    options={formattedRoleOptions}*/}
          {/*    selectedOptions={selectedRoleOptions}*/}
          {/*    onChange={handleRoleSelect}*/}
          {/*    onOpen={lookupHandlers.onOpen.role}*/}
          {/*    loading={role.loading}*/}
          {/*  />*/}
          {/*</Grid>*/}

          <Grid size={{ xs: 12, md: 4 }}>
            <StatusMultiSelectDropdown
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
