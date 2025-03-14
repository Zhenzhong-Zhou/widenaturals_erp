import { FC } from 'react';
import { useInventoryHistory } from '../../../hooks';
import {
  InventoryHistoryTable,
  ReportPageLayout,
  useReportPageLogic,
} from '../index.ts';
import {
  ErrorDisplay,
  ErrorMessage,
  Loading,
  Typography,
} from '@components/index.ts';

const InventoryHistoryPage: FC = () => {
  const reportCategory = 'inventory_history';

  const {
    data,
    loading,
    error,
    pagination,
    fetchInventoryHistory,
    exportInventoryHistory,
    exportData,
    exportFormat,
    exportLoading,
    exportError,
  } = useInventoryHistory();

  const reportLogic = useReportPageLogic({
    fetchData: fetchInventoryHistory,
    exportData,
    exportFormat,
    reportCategory,
    exportLoading,
    exportError,
    data,
    pagination,
  });

  if (loading) return <Loading message="Loading inventory history..." />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );

  return (
    <ReportPageLayout
      title="Inventory History"
      subtitle="Track inventory movements & adjustments"
      {...reportLogic}
      fetchData={() => fetchInventoryHistory(reportLogic.filters)}
      exportData={() =>
        exportInventoryHistory({
          ...reportLogic.filters,
          reportCategory: reportLogic.filters.reportCategory,
          exportFormat: reportLogic.filters.exportFormat,
        })
      }
    >
      {Array.isArray(data) && data.length > 0 ? (
        <InventoryHistoryTable
          data={data}
          pagination={reportLogic.pagination}
          filters={reportLogic.filters}
          setFilters={reportLogic.setFilters}
          fetchInventoryHistory={fetchInventoryHistory}
        />
      ) : (
        <Typography variant="body1" sx={{ textAlign: 'center', padding: 2 }}>
          No inventory history records available.
        </Typography>
      )}
    </ReportPageLayout>
  );
};

export default InventoryHistoryPage;
