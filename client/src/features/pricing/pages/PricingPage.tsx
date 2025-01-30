import { useEffect } from 'react';
import { usePricing } from '../../../hooks';
import Button from '@mui/material/Button';

const PricingsPage = () => {
  const { pricingData, pagination, loading, error, fetchPricings } = usePricing();
  
  useEffect(() => {
    fetchPricings(pagination.page, pagination.limit);
  }, [pagination.page]);
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchPricings(newPage, pagination.limit);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Pricing Records</h1>
      
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && (
        <>
          <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg">
            <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Price Type</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Valid From</th>
              <th className="p-3 text-left">Valid To</th>
              <th className="p-3 text-left">Status</th>
            </tr>
            </thead>
            <tbody>
            {pricingData.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-4">No pricing records found.</td>
              </tr>
            ) : (
              pricingData.map((pricing) => (
                <tr key={pricing.pricing_id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{pricing.product_name}</td>
                  <td className="p-3">{pricing.price_type}</td>
                  <td className="p-3">{pricing.location_name}</td>
                  <td className="p-3">${parseFloat(pricing.price).toFixed(2)}</td>
                  <td className="p-3">{new Date(pricing.valid_from).toLocaleDateString()}</td>
                  <td className="p-3">{new Date(pricing.valid_to).toLocaleDateString()}</td>
                  <td className={`p-3 ${pricing.status_name === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {pricing.status_name}
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <Button disabled={pagination.page === 1} onClick={() => handlePageChange(pagination.page - 1)}>
              Previous
            </Button>
            <span className="text-gray-600">Page {pagination.page} of {pagination.totalPages}</span>
            <Button disabled={pagination.page === pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)}>
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PricingsPage;
