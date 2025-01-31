import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/storeHooks.ts';
import { getPricingDetails } from '../state/pricingThunks';
import { selectPricing, selectPricingError, selectPricingLoading } from '../state/pricingDetailSelectors.ts';
import { Loading, ErrorMessage } from '@components/index.ts';
import { useParams } from 'react-router-dom';

const PricingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const pricing = useAppSelector(selectPricing);
  const loading = useAppSelector(selectPricingLoading);
  const error = useAppSelector(selectPricingError);
  
  useEffect(() => {
    dispatch(getPricingDetails({ pricingId: id, page: 1, limit: 10 }));
  }, [dispatch, id]);
  
  if (loading) return <Loading message="Loading Pricing Details..." />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>
      <h1>Pricing Details</h1>
      {pricing && (
        <div>
          <p><strong>Price:</strong> ${pricing.price}</p>
          <p><strong>Valid From:</strong> {new Date(pricing.valid_from).toLocaleDateString()}</p>
          <p><strong>Valid To:</strong> {new Date(pricing.valid_to).toLocaleDateString()}</p>
          <p><strong>Product:</strong> {pricing.product.name} - {pricing.product.brand}</p>
          <p><strong>Location:</strong> {pricing.location.location_name} ({pricing.location.location_type.type_name})</p>
          <p><strong>Status:</strong> {pricing.status_name}</p>
        </div>
      )}
    </div>
  );
};

export default PricingDetailPage;
