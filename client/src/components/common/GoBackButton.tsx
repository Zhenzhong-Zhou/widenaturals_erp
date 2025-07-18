import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '@components/common/CustomButton';
import type { SxProps, Theme } from '@mui/system';
import type { ButtonProps } from '@mui/material';

interface GoBackButtonProps extends ButtonProps {
  label?: string;
  sx?: SxProps<Theme>;
}

const GoBackButton: FC<GoBackButtonProps> = ({ label = 'Go Back', sx }) => {
  const navigate = useNavigate();

  return (
    <CustomButton
      onClick={() => navigate(-1)}
      sx={{
        mt: 2,
        minWidth: '120px', // Fixed width to avoid CLS
        px: 3, // Consistent horizontal padding
        py: 1.25, // Slight vertical padding for tap targets
        fontWeight: 600,
        borderRadius: '20px', // Rounded corner consistency
        fontFamily: "'Roboto', sans-serif", // Prevent FOUT if custom font
        textTransform: 'none', // Avoid default uppercase transform
        ...sx,
      }}
    >
      {label}
    </CustomButton>
  );
};

export default GoBackButton;
