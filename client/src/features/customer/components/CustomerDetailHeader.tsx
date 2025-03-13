import { FC } from "react";
import Box from "@mui/material/Box";
import { useThemeContext } from "../../../context/ThemeContext";
import { GoBackButton, Typography } from '@components/index.ts';

interface CustomerDetailHeaderProps {
  customerName: string;
}

const CustomerDetailHeader: FC<CustomerDetailHeaderProps> = ({ customerName }) => {
  const { theme } = useThemeContext();
  
  return (
    <Box sx={{ textAlign: "center", marginBottom: theme.spacing(3) }}>
      <GoBackButton/>
      {/* Customer Name */}
      <Typography
        variant="h6"
        sx={{
          marginTop: theme.spacing(2),
          color: theme.palette.text.primary,
        }}
      >
        Customer Name: {customerName} Info
      </Typography>
    </Box>
  );
};

export default CustomerDetailHeader;
