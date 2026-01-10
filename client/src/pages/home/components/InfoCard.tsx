import type { FC } from 'react';
import { Paper, Box } from '@mui/material';
import { CustomTypography } from '@components/index';

export interface InfoCardProps {
  title: string;
  body: string;
  bullets?: string[];
}

const InfoCard: FC<InfoCardProps> = ({ title, body, bullets }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: 2.25,
        backgroundColor: 'background.paper',
        boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
      }}
    >
      <CustomTypography variant="subtitle2" fontWeight={800}>
        {title}
      </CustomTypography>
      
      <CustomTypography
        variant="body2"
        sx={{ mt: 1.25, color: 'text.secondary', lineHeight: 1.6 }}
      >
        {body}
      </CustomTypography>
      
      {bullets?.length ? (
        <Box component="ul" sx={{ mt: 1.5, pl: 2 }}>
          {bullets.map((b) => (
            <CustomTypography
              key={b}
              component="li"
              variant="body2"
              sx={{ color: 'text.secondary', mt: 0.75 }}
            >
              {b}
            </CustomTypography>
          ))}
        </Box>
      ) : null}
    </Paper>
  );
};

export default InfoCard;
