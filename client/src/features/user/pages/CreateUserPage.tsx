import Box from '@mui/material/Box';
import { CustomTypography, GoBackButton } from '@components/index';
import { CreateUserForm } from '@features/user/components/CreateUser';

/**
 * CreateUserPage
 *
 * Page-level container for the create-user workflow.
 *
 * Responsibilities:
 * - Provide page structure and layout
 * - Render the CreateUserForm
 *
 * MUST NOT:
 * - Contain form logic
 * - Perform API calls or mutations
 * - Handle validation or submission state
 */
const CreateUserPage = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <CustomTypography variant="h4" gutterBottom>
          Create User
        </CustomTypography>
        <GoBackButton />
      </Box>

      <CreateUserForm />
    </Box>
  );
};

export default CreateUserPage;
