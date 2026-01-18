import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomForm, ErrorMessage } from '@components/index';
import { useCreateUser, useRoleLookup } from '@hooks/index';
import { CreateUserRequest } from '@features/user';
import { getCreateUserFormFields } from '@features/user/utils';
import type { RoleLookupParams } from '@features/lookup';
import { createLookupParams } from '@features/lookup/utils/lookupUtils';
import { useRoleSearchHandlers } from '@features/lookup/hooks';

/**
 * CreateUserForm
 *
 * Form component responsible for rendering and submitting
 * the create-user workflow.
 *
 * Responsibilities:
 * - Define form fields and layout
 * - Bind submit handler to create-user mutation
 * - React to successful creation (redirect)
 */
const CreateUserForm = () => {
  const navigate = useNavigate();
  
  const {
    data: createdUser,
    loading: isCreatingUser,
    error: createUserError,
    success: isCreateUserSuccess,
    createUser,
    resetCreateUser,
  } = useCreateUser();
  
  const roleLookup = useRoleLookup();
  
  // Controlled search input value for role dropdown
  const [inputValue, setInputValue] = useState('');
  
  // Lookup query state (pagination + keyword)
  const [fetchParams, setFetchParams] = useState<RoleLookupParams>(
    () => createLookupParams<RoleLookupParams>({ limit: 10 })
  );
  
  // Debounced role keyword search handler
  const { handleRoleSearch } = useRoleSearchHandlers(roleLookup);
  
  const fields = useMemo(
    () =>
      getCreateUserFormFields({
        roleLookup: {
          ...roleLookup,
          inputValue,
          setInputValue,
          fetchParams,
          setFetchParams,
          onRefresh: roleLookup.fetch,
          onKeywordChange: handleRoleSearch,
        },
      }),
    [
      roleLookup.options,
      roleLookup.loading,
      roleLookup.error,
      roleLookup.meta,
      roleLookup.fetch,
      inputValue,
      fetchParams,
      handleRoleSearch,
    ]
  );
  
  const handleSubmit = async (data: Record<string, any>) => {
    const { password, confirmPassword, ...rest } = data;
    
    await createUser({
      ...rest,
      password,
    } as CreateUserRequest);
  };
  
  useEffect(() => {
    if (!isCreateUserSuccess || !createdUser) return;
    
    // Navigate after successful creation
    navigate(`/users/${createdUser.id}/profile`);
    
    // Reset mutation state to prevent stale success on remount
    resetCreateUser();
  }, [isCreateUserSuccess, createdUser, navigate, resetCreateUser]);
  
  return (
    <CustomForm
      fields={fields}
      onSubmit={handleSubmit}
      submitButtonLabel="Create User"
      disabled={isCreatingUser}
      showSubmitButton
    >
      {createUserError && <ErrorMessage message={createUserError} />}
    </CustomForm>
  );
};

export default CreateUserForm;
