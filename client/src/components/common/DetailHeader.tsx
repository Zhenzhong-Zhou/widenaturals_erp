import { FC } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@components/common/Typography';
import { useThemeContext } from '@context/ThemeContext';

interface DetailHeaderProps {
  avatarSrc?: string;
  avatarFallback?: string;
  name: string;
  subtitle?: string;
}

const DetailHeader: FC<DetailHeaderProps> = ({
  avatarSrc,
  avatarFallback,
  name,
  subtitle,
}) => {
  const { theme } = useThemeContext();

  return (
    <Box sx={{ textAlign: 'center', marginBottom: theme.spacing(3) }}>
      <Avatar
        src={avatarSrc}
        alt={name}
        sx={{
          width: 100,
          height: 100,
          margin: '0 auto',
          bgcolor: theme.palette.primary.main,
          fontSize: 36,
        }}
      >
        {avatarFallback}
      </Avatar>
      <Typography
        variant="h6"
        sx={{ marginTop: theme.spacing(2), color: theme.palette.text.primary }}
      >
        {name}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            marginBottom: theme.spacing(2),
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default DetailHeader;
