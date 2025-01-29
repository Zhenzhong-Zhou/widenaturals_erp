import { usePricingTypes } from '../../../hooks';
import { PricingTypeTable } from '../index.ts';


const PricingTypePage = () => {
  const {
    data,
    totalRecords,
    totalPages,
    page,
    limit,
    isLoading,
    error,
    setPage,
    setLimit,
    refetch,
  } = usePricingTypes({ initialPage: 1, initialLimit: 10 });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <PricingTypeTable
        data={data}
        totalRecords={totalRecords}
        rowsPerPage={limit}
        page={page}
        onPageChange={(newPage) => setPage(newPage)}
        onRowsPerPageChange={(newLimit) => setLimit(newLimit)}
      />
      <button onClick={refetch}>Refetch Data</button>
    </div>
  );
};

export default PricingTypePage;
