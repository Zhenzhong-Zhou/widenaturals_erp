import type { FC } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CustomButton from '@components/common/CustomButton';

interface AddAddressButtonProps {
  /**
   * Optional route to navigate to (if provided).
   * If not provided and `onClick` is given, button triggers that handler instead.
   */
  to?: string;
  
  /**
   * Callback function to a toggle address form (single or bulk).
   * Ignored if `to` is provided.
   */
  onClick?: () => void;
  
  size?: 'small' | 'medium' | 'large';
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'info';
  loading?: boolean;
}

const AddAddressButton: FC<AddAddressButtonProps> = ({
                                                       to,
                                                       onClick,
                                                       size = 'medium',
                                                       variant = 'contained',
                                                       color = 'primary',
                                                       loading = false,
                                                     }) => (
  <CustomButton
    to={to}
    onClick={!to ? onClick : undefined}
    size={size}
    variant={variant}
    color={color}
    icon={<AddIcon />}
    loading={loading}
  >
    Add Address
  </CustomButton>
);

export default AddAddressButton;
