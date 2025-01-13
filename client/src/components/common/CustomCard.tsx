import { FC, ReactNode } from 'react';
import { Card, CardContent, Box, SxProps, Theme } from '@mui/material';
import { Typography } from '@components/index';

interface CustomCardProps {
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  ariaLabel?: string;
  role?: string;
}

const CustomCard: FC<CustomCardProps> = ({
                                           title,
                                           subtitle,
                                           children,
                                           sx,
                                           contentSx,
                                           ariaLabel,
                                           role = 'region',
                                         }) => {
  return (
    <Card
      aria-label={ariaLabel}
      role={role}
      sx={{
        maxWidth: 400,
        margin: '0 auto',
        padding: 3,
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: (theme) => theme.palette.background.paper,
        ...sx,
      }}
    >
      <CardContent sx={{ ...contentSx }}>
        {title && (
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{ fontWeight: 'bold', color: (theme) => theme.palette.text.primary }}
          >
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography
            variant="body1"
            align="center"
            gutterBottom
            sx={{ color: (theme) => theme.palette.text.secondary }}
          >
            {subtitle}
          </Typography>
        )}
        <Box mt={2}>{children}</Box>
      </CardContent>
    </Card>
  );
};

export default CustomCard;
