import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '@components/common/CustomButton';

interface GoBackButtonProps {
  label?: string;
}

const GoBackButton: FC<GoBackButtonProps> = ({ label = 'Go Back' }) => {
  const navigate = useNavigate();

  return (
    <CustomButton
      variant="contained"
      color="primary"
      sx={{ mt: 2 }}
      onClick={() => navigate(-1)} // Navigate back
    >
      {label}
    </CustomButton>
  );
};

export default GoBackButton;
