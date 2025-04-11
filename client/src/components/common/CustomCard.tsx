import type { FC, ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import type { SxProps, Theme } from '@mui/system';

interface CustomCardProps {
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  children?: ReactNode;
  imageUrl?: string; // Optional media
  actions?: ReactNode; // Optional actions
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  ariaLabel?: string;
  role?: string;
}

const CustomCard: FC<CustomCardProps> = ({
  title,
  subtitle,
  children,
  imageUrl,
  actions,
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
      {/* Optional Media */}
      {imageUrl && (
        <CardMedia
          component="img"
          height="340"
          image={imageUrl}
          alt={typeof title === 'string' ? title : 'Card Image'}
          sx={{
            objectFit: 'cover', // Correct usage of objectFit
            borderRadius: 1,
          }}
        />
      )}

      <CardContent sx={{ ...contentSx }}>
        {title && (
          <CustomTypography
            variant="h5"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              color: (theme) => theme.palette.text.primary,
            }}
          >
            {title}
          </CustomTypography>
        )}
        {subtitle && (
          <CustomTypography
            variant="body1"
            align="center"
            gutterBottom
            sx={{ color: (theme) => theme.palette.text.secondary }}
          >
            {subtitle}
          </CustomTypography>
        )}
        {children && <Box mt={2}>{children}</Box>}
      </CardContent>

      {/* Optional Actions */}
      {actions && (
        <CardActions sx={{ justifyContent: 'center' }}>{actions}</CardActions>
      )}
    </Card>
  );
};

export default CustomCard;
