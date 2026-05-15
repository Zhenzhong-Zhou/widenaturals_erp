import type { FC, ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Card, CardActions, CardContent, CardMedia } from '@mui/material';
import { CustomTypography } from '@components/index';

interface CustomCardProps {
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  children?: ReactNode;
  imageUrl?: string; // Optional media
  imageAlt?: string;
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
  imageAlt,
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
        padding: 2,
        borderRadius: 2,
        boxShadow: 1,
        backgroundColor: 'var(--bg-paper)', // dynamic, LCP-safe via CSS variable
        transition: 'background-color 0.3s ease-in-out',
        ...sx,
      }}
    >
      {/* Optional Media */}
      {imageUrl && (
        <CardMedia
          component="img"
          height="340"
          image={imageUrl}
          alt={imageAlt || (typeof title === 'string' ? title : 'Card image')}
          loading="lazy"
          sx={{
            objectFit: 'cover',
            borderRadius: 1,
          }}
        />
      )}
      
      <CardContent sx={contentSx}>
        {title &&
          (typeof title === 'string' ? (
            <CustomTypography
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontFamily: "'Roboto', sans-serif",
                color: 'var(--text-primary)',
                minHeight: '32px',
                textRendering: 'optimizeLegibility',
              }}
            >
              {title}
            </CustomTypography>
          ) : (
            title
          ))}
        
        {subtitle && (
          <CustomTypography
            variant="body1"
            align="center"
            gutterBottom
            sx={{
              color: 'var(--text-secondary)',
              minHeight: '24px',
            }}
          >
            {subtitle}
          </CustomTypography>
        )}
        
        {children && <Box sx={{ mt: 2 }}>{children}</Box>}
      </CardContent>

      {actions ? (
        <CardActions sx={{ justifyContent: 'center' }}>{actions}</CardActions>
      ) : (
        <Box sx={{ height: 40 }} aria-hidden="true" />
      )}
    </Card>
  );
};

export default CustomCard;
