import type { FC, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CustomButton from '@components/common/CustomButton';
import type { SxProps, Theme } from '@mui/system';
import type { ButtonProps } from '@mui/material';

interface GoBackButtonProps extends ButtonProps {
  /**
   * Text label displayed inside the button.
   * Defaults to `"Back"`.
   */
  label?: string;
  
  /**
   * Route to navigate to when browser history cannot be used (e.g., direct page load).
   * Defaults to the application root `/`.
   */
  fallbackTo?: string;
  
  /**
   * Additional MUI `sx` styling overrides for the button.
   */
  sx?: SxProps<Theme>;
  
  /**
   * MUI button variant for styling purposes.
   * Defaults to `"outlined"`.
   */
  variant?: "contained" | "outlined" | "text";
  
  /**
   * Optional callback executed immediately before navigation occurs.
   * Useful for cleanup tasks (resetting forms, clearing state, etc.).
   */
  beforeNavigate?: () => void;
  
  /**
   * Optional button icon. Defaults to the standard arrow-back icon.
   */
  icon?: ReactNode;
}

/**
 * A universal back-navigation button component used throughout the application.
 *
 * Behavior:
 * - If browser history has previous entries → navigates back (`navigate(-1)`).
 * - If the user arrived via direct URL or no history is available → navigates to `fallbackTo`.
 *
 * Key Use Cases:
 * - Detail pages where users may enter by clicking from a list *or* via a shared URL.
 * - Pages that require predictable navigation even without browser history.
 * - Ensures consistent “Back” behavior across the entire system.
 *
 * Styling:
 * - Applies a consistent button shape, spacing, typography, and min-width
 *   to prevent layout shifts (CLS) and support UX guidelines.
 */
const GoBackButton: FC<GoBackButtonProps> = ({
                                               label = "Back",
                                               fallbackTo = "/",
                                               sx,
                                               variant = "outlined",
                                               icon = <ArrowBackIcon />,
                                               beforeNavigate,
                                             }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    beforeNavigate?.();
    
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackTo, { replace: true });
    }
  };
  
  return (
    <CustomButton
      onClick={handleBack}
      variant={variant}
      icon={icon}
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
