import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

interface SectionProps {
  title?: string;
  children: ReactNode;
  spacingTop?: number;
  spacingBottom?: number;
}

const Section: FC<SectionProps> = ({
  title,
  children,
  spacingTop = 4,
  spacingBottom = 4,
}) => {
  return (
    <Box sx={{ mt: spacingTop, mb: spacingBottom }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      {children}
      <Divider sx={{ mt: spacingBottom }} />
    </Box>
  );
};

export default Section;
