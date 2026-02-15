import type { Dispatch, SetStateAction } from 'react';
import type {
  CustomRenderParams,
  FieldConfig,
} from '@components/common/CustomForm.tsx';
import { emailValidator } from '@utils/validation.ts';
import { PasswordInput } from '@components/index.ts';
import FieldStatusHelper from '@components/common/FieldStatusHelper.tsx';
import RoleDropdown from '@features/lookup/components/RoleDropdown.tsx';
import { normalizeLookupParams } from '@features/lookup/utils/lookupUtils.ts';
import type {
  LookupOption,
  LookupPaginationMeta,
  LookupQuery,
} from '@features/lookup';
import { validatePasswordStrength } from '@features/auth/utils/validatePassword.ts';
import { formatLabel } from '@utils/textUtils.ts';

/**
 * External dependencies required by the Create User form.
 * All lookup-related state must be injected.
 */
interface CreateUserFormDeps {
  roleLookup: {
    options: LookupOption[];
    loading: boolean;
    error: string | null;
    meta: LookupPaginationMeta;
    fetchParams: LookupQuery;
    setFetchParams: Dispatch<SetStateAction<LookupQuery>>;
    onRefresh: (params?: any) => void;
    onKeywordChange?: (keyword: string) => void;
    inputValue: string;
    setInputValue: (v: string) => void;
  };
}

/**
 * Factory: Create User form field configuration.
 *
 * IMPORTANT:
 * - This function must remain pure
 * - All stateful logic is injected via `deps`
 */
export const getCreateUserFormFields = (
  deps: CreateUserFormDeps
): FieldConfig[] => {
  const {
    roleLookup: {
      options,
      loading,
      error,
      meta,
      fetchParams,
      setFetchParams,
      onRefresh,
      inputValue,
      setInputValue,
      onKeywordChange,
    },
  } = deps;

  const mapRoleOptionsToUi = (options: LookupOption[]) =>
    options.map((opt) => ({
      label: formatLabel(opt.label),
      value: opt.value,
    }));

  const roleOptionsUi = mapRoleOptionsToUi(options);

  return [
    {
      id: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      validation: emailValidator,
      grid: { xs: 12 },
    },
    {
      id: 'password',
      type: 'custom',
      required: true,
      grid: { xs: 12, md: 6 },
      customRender: ({ value, onChange, required }: CustomRenderParams) => {
        if (!onChange) return null;

        const validationError = value ? validatePasswordStrength(value) : null;

        return (
          <PasswordInput
            label="Create Password"
            intent="create"
            value={value ?? ''}
            onChange={onChange}
            errorText={validationError ? validationError : ''}
            helperText={
              !value && required ? (
                <FieldStatusHelper status="required" />
              ) : validationError ? (
                <FieldStatusHelper status="invalid" />
              ) : value ? (
                <FieldStatusHelper status="valid" />
              ) : undefined
            }
          />
        );
      },
    },
    {
      id: 'confirmPassword',
      type: 'custom',
      required: true,
      customRender: ({ value, onChange, required, formValues }) => {
        if (!onChange) return null;

        const password = formValues.password;

        const mismatch = value && password && value !== password;

        return (
          <PasswordInput
            label="Confirm Password"
            value={value ?? ''}
            onChange={onChange}
            errorText={mismatch ? 'Passwords do not match' : undefined}
            helperText={
              !value && required ? (
                <FieldStatusHelper status="required" />
              ) : mismatch ? (
                <FieldStatusHelper status="invalid" />
              ) : value ? (
                <FieldStatusHelper status="valid" />
              ) : undefined
            }
          />
        );
      },
    },
    {
      id: 'firstname',
      label: 'First Name',
      type: 'text',
      required: true,
    },
    {
      id: 'lastname',
      label: 'Last Name',
      type: 'text',
      required: true,
    },
    {
      id: 'phoneNumber',
      label: 'Phone Number',
      type: 'phone',
      country: 'ca',
    },
    {
      id: 'jobTitle',
      label: 'Job Title',
      type: 'text',
    },
    {
      id: 'roleId',
      label: 'Role',
      type: 'custom',
      required: true,
      customRender: ({ value, onChange }: CustomRenderParams) =>
        onChange ? (
          <RoleDropdown
            label="Role"
            value={value ?? ''}
            onChange={(id) => onChange(id)}
            /**
             * Keyword search handler:
             * - Updates local keyword state
             * - Resets pagination
             * - Triggers debounced lookup fetch
             */
            inputValue={inputValue}
            onInputChange={(_e, newInputValue, reason) => {
              setInputValue(newInputValue);

              if (reason !== 'input') return;

              setFetchParams((prev: LookupQuery) =>
                normalizeLookupParams({
                  ...prev,
                  keyword: newInputValue,
                  offset: 0,
                })
              );

              onKeywordChange?.(newInputValue);
            }}
            /** lookup state */
            options={roleOptionsUi}
            loading={loading}
            error={error}
            paginationMeta={meta}
            /** pagination + reload */
            fetchParams={fetchParams}
            setFetchParams={setFetchParams}
            onRefresh={(params) =>
              onRefresh(normalizeLookupParams(params ?? {}))
            }
          />
        ) : null,
    },
    {
      id: 'note',
      label: 'Internal Note',
      type: 'textarea',
      rows: 3,
      grid: { xs: 12 },
    },
  ];
};
