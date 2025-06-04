import { type FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';
import GoBackButton from '@components/common/GoBackButton.tsx';

interface FallbackUIProps {
  title?: string;
  description?: string;
  errorCode?: string;
  errorLog?: string;
  onRetry?: () => void;
}

const FallbackUI: FC<FallbackUIProps> = ({
                                           title = 'Oops! Something went wrong.',
                                           description = 'Please try again later or contact support.',
                                           errorCode,
                                           errorLog,
                                           onRetry,
                                         }) => {
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();
  
  const handleGoHome = () => navigate('/');
  
  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: '0 auto',
        padding: 4,
        borderRadius: 2,
        textAlign: 'center',
        backgroundColor: '#fdfdfd', // Avoid theme eval
        color: '#111',
        boxShadow: 2,
      }}
    >
      {/* Error Title */}
      <CustomTypography
        variant="h4"
        sx={{ fontWeight: 700, color: '#d32f2f' }}
        gutterBottom
      >
        {title}
      </CustomTypography>
      
      {/* Error Description */}
      <CustomTypography
        variant="body1"
        sx={{ color: '#444', marginBottom: 2 }}
      >
        {description}
      </CustomTypography>
      
      {/* Optional Error Code */}
      {errorCode && (
        <ErrorMessage
          message={`Error Code: ${errorCode}`}
          severity="info"
          sx={{ marginBottom: 2 }}
        />
      )}
      
      {/* Expandable Error Log */}
      {errorLog && (
        <Box>
          <CustomButton
            variant="text"
            size="small"
            onClick={() => setShowDetails((prev) => !prev)}
            sx={{ marginBottom: 1 }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </CustomButton>
          
          {showDetails && (
            <Box
              component="pre"
              sx={{
                textAlign: 'left',
                backgroundColor: '#fafafa',
                color: '#555',
                padding: 2,
                borderRadius: 1,
                maxHeight: 200,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '0.875rem',
              }}
            >
              {errorLog}
            </Box>
          )}
        </Box>
      )}
      
      {/* Actions */}
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          columnGap: 2,
          rowGap: 2,
        }}
      >
        {/* Retry Button */}
        {onRetry && (
          <CustomButton
            variant="contained"
            color="primary"
            onClick={onRetry}
            sx={{
              minWidth: 120,
              px: 3,
              fontWeight: 600,
            }}
          >
            Retry
          </CustomButton>
        )}
        
        {/* Go Back */}
        <GoBackButton
          color="success"
          variant="contained"
          sx={{
            minWidth: 120,
            px: 3,
            fontWeight: 600,
            borderRadius: 200,
            mt: 0, // override default spacing
          }}
        />
        
        {/* Go Home */}
        <CustomButton
          variant="outlined"
          color="secondary"
          onClick={handleGoHome}
          sx={{
            minWidth: 120,
            px: 3,
            fontWeight: 600,
          }}
        >
          Go Home
        </CustomButton>
      </Box>
    </Box>
  );
};

export default FallbackUI;
