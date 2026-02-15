import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import NoDataFound from '@components/common/NoDataFound';
import GoBackButton from '@components/common/GoBackButton';
import GroupedPricingDetailsTable from '@features/pricing/components/GroupedPricingDetailsTable';
import usePricingListByType from '@hooks/usePricingListByType';
import type { PricingDetail } from '@features/pricing/state';

const PricingDetailPage = () => {
  const { id: pricingTypeId } = useParams<{ id: string }>();
  const {
    data,
    loading,
    error,
    fetchData: fetchPricingList,
  } = usePricingListByType();

  // Fetch data on mount or when pricingTypeId changes
  useEffect(() => {
    if (!pricingTypeId) return;

    fetchPricingList(pricingTypeId, 1, 1000);
  }, [pricingTypeId]);

  if (!data) {
    return <NoDataFound message="No pricing detail list data found." />;
  }

  if (loading) {
    return <Loading message="Loading Pricing Details..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data || data.length === 0) {
    return <NoDataFound message="No pricing detail list data found." />;
  }

  const groupPricingByTypeAndPrice = (records: PricingDetail[]) => {
    return records.reduce(
      (acc, record) => {
        const groupKey = `${record.pricingType.name} - CA${record.pricing.price} - ${record.pricing.locationName}`;
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(record);
        return acc;
      },
      {} as Record<string, PricingDetail[]>
    );
  };

  const groupedData = groupPricingByTypeAndPrice(data);

  return (
    <Box sx={{ padding: 3 }}>
      <GoBackButton />
      <GroupedPricingDetailsTable groupedData={groupedData} />
    </Box>
  );
};

export default PricingDetailPage;
