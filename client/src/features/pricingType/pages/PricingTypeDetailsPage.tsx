import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import usePricingTypeMetadata from '@hooks/usePricingTypeMetadata';
import Box from '@mui/material/Box';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import NoDataFound from '@components/common/NoDataFound';
import Loading from '@components/common/Loading';
import GoBackButton from '@components/common/GoBackButton';
import CustomButton from '@components/common/CustomButton';
import MetadataSection from '@components/common/MetadataSection';
import { formatLabel, formatNullable } from '@utils/textUtils';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';

const PricingTypeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <ErrorDisplay>
        <ErrorMessage message="Pricing Type ID is required." />
      </ErrorDisplay>
    );
  }
  
  const {
    data,
    isLoading,
    error,
    fetchData,
    statusName,
  } = usePricingTypeMetadata();
  
  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id, fetchData]);
  
  if (!data) {
    return <NoDataFound/>;
  }
  
  const flattenedData = {
    name: data.name,
    code: data.code,
    slug: data.slug,
    description: data.description,
    status: formatLabel(statusName),
    statusDate: formatDate(data.status.statusDate),
    createdBy: data.createdBy.fullName,
    createdAt: formatDateTime(data.createdAt),
    updatedBy: formatNullable(data.updatedBy.fullName),
    updatedAt: formatDateTime(data.updatedAt),
  };
  
  if (isLoading) return <Loading message="Fetching pricing type metadata..." />;
  
  if (error) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  }
  
  return (
    <Box
      mt={{ xs: 3, md: 4 }}
      mx="auto"
      px={{ xs: 2, sm: 3, md: 4 }}
      width="100%"
      maxWidth={{ xs: '100%', sm: '720px', md: '900px', lg: '1080px' }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={2}
        gap={2}
      >
        <GoBackButton />
        <CustomButton onClick={() => fetchData(id)} variant="outlined">
          Refresh Data
        </CustomButton>
      </Box>
      <CustomTypography variant="h4">
        {data.name} ({data.code})
      </CustomTypography>
      <CustomTypography variant="subtitle1" color="text.secondary">
        {data.description}
      </CustomTypography>
      <Box mt={3}>
        <MetadataSection
          data={flattenedData}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr', // one column on mobile
              sm: '1fr 1fr' // two columns on small screens and up
            },
            columnGap: 4,
            rowGap: 2,
            mt: 2,
          }}
        />
      </Box>
    </Box>
  );
};

export default PricingTypeDetailPage;
