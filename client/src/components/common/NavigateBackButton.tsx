import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SxProps, Theme } from '@mui/system';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CustomButton from '@components/common/CustomButton';

interface NavigateBackButtonProps {
  /** Button label text */
  label?: string;
  
  /** Route to navigate to when history cannot go back */
  fallbackTo?: string;
  
  /** Custom styles for the button */
  sx?: SxProps<Theme>;
  
  /** Optional callback invoked before navigation */
  onBeforeNavigate?: () => void;
}

/**
 * A reusable back-navigation button.
 *
 * Behavior:
 * - If browser history has entries, navigates back using `navigate(-1)`.
 * - If not (direct URL visit), navigates to `fallbackTo`.
 *
 * This ensures consistent navigation UX across the app, even when users
 * land directly on detail pages via bookmarks or shared links.
 */
const NavigateBackButton: FC<NavigateBackButtonProps> = ({
                                           label = 'Back',
                                           fallbackTo = '/',
                                           sx,
                                           onBeforeNavigate,
                                         }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    onBeforeNavigate?.();
    
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };
  
  return (
    <CustomButton
      variant="outlined"
      color="primary"
      icon={<ArrowBackIcon />}
      onClick={handleBack}
      sx={sx}
    >
      {label}
    </CustomButton>
  );
};

export default NavigateBackButton;
