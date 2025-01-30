import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorDisplay, ErrorMessage } from '@components/index.ts';
import usePricingDetails from '../../../hooks/usePricingTypeDetails.ts';
import PricingTypeDetailsTable from '../components/PricingTypeDetailsTable';

const PricingTypeDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <ErrorDisplay><ErrorMessage message="Pricing Type ID is required." /></ErrorDisplay>;
  }
  
  const {
    pricingTypeDetails,
    pricingRecords,
    pagination,
    isLoading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    refetch,
  } = usePricingDetails({
    pricingTypeId: id,
    initialPage: 1,
    initialLimit: 10,
  });
  
  return (
    <PricingTypeDetailsTable
      pricingTypeDetails={pricingTypeDetails} // Pass the pricing type metadata
      data={pricingRecords} // Pass the pricing records
      pagination={pagination}
      isLoading={isLoading}
      error={error}
      page={page}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={setLimit}
      refetch={refetch}
    />
  );
};

export default PricingTypeDetailsPage;
