import { FC } from "react";
import Button, { ButtonProps } from "@mui/material/Button";
import { Link as RouterLink } from "react-router-dom";
import { useThemeContext } from "../../context";

interface CustomButtonProps extends ButtonProps {
  to?: string; // Optional 'to' prop for routing
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  size?: "small" | "medium" | "large";
}

const CustomButton: FC<CustomButtonProps> = ({
                                               children,
                                               to, // Link destination
                                               variant = "contained", // Default to 'contained' for primary actions
                                               color = "primary", // Default to primary color
                                               size = "medium", // Default size
                                               ...props
                                             }) => {
  const { theme } = useThemeContext();
  
  return (
    <Button
      component={to ? RouterLink : "button"} // Use RouterLink when `to` is provided
      to={to} // Pass `to` to RouterLink
      variant={variant}
      color={color}
      size={size}
      {...props}
      sx={{
        textTransform: "none",
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(1, 2),
        boxShadow: variant === "contained" ? theme.shadows[2] : "none",
        "&:hover": {
          boxShadow: variant === "contained" ? theme.shadows[4] : "none",
        },
        ...props.sx,
      }}
    >
      {children}
    </Button>
  );
};

export default CustomButton;
