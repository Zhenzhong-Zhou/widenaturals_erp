import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';

interface ResultBodyProps {
  icon?: ReactNode;
  message: ReactNode; // main header
  details?: ReactNode; // flexible body (string | JSX | list | object)
  align?: 'left' | 'center'; // optional alignment
}

const ResultBody: FC<ResultBodyProps> = ({
  icon,
  message,
  details,
  align = 'center',
}) => (
  <Box style={{ textAlign: align, padding: '1rem' }}>
    {icon && <Box style={{ marginBottom: 12 }}>{icon}</Box>}

    <CustomTypography variant="h6">{message}</CustomTypography>

    {details && (
      <Box style={{ marginTop: 8 }}>
        {typeof details === 'string' ? (
          <CustomTypography variant="body2" color="text.secondary">
            {details}
          </CustomTypography>
        ) : (
          details
        )}
      </Box>
    )}
  </Box>
);

export default ResultBody;
