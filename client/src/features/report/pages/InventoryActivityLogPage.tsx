import { FC } from 'react';
import useInventoryActivityLogs from '@hooks/useInventoryActivityLogs';
import useReportPageLogic from '@features/report/hook/useReportPageLogic';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import ReportPageLayout from '@features/report/components/ReportPageLayout';
import InventoryActivityLogTable from '@features/report/components/InventoryActivityLogTable';
import CustomTypography from '@components/common/CustomTypography';

const InventoryActivityLogPage: FC = () => {
  const reportCategory = 'inventory_activity';

  const {
    inventoryLogs,
    isLoading,
    error,
    pagination,
    fetchInventoryActivityLogs,
    exportLogs,
    exportData,
    exportFormat,
    exportLoading,
    exportError,
  } = useInventoryActivityLogs();

  const reportLogic = useReportPageLogic({
    fetchData: fetchInventoryActivityLogs,
    exportData,
    exportFormat,
    reportCategory,
    exportLoading,
    exportError,
    data: inventoryLogs,
    pagination,
  });

  if (isLoading) return <Loading message="Loading activity logs..." />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );

  return (
    <ReportPageLayout
      title="Inventory Activity Logs"
      subtitle="Detailed Inventory Transactions"
      {...reportLogic}
      fetchData={() => fetchInventoryActivityLogs(reportLogic.filters)}
      exportData={() =>
        exportLogs({
          ...reportLogic.filters,
          reportCategory: reportLogic.filters.reportCategory,
          exportFormat: reportLogic.filters.exportFormat,
        })
      }
    >
      {Array.isArray(inventoryLogs) && inventoryLogs.length > 0 ? (
        <InventoryActivityLogTable
          data={inventoryLogs}
          pagination={reportLogic.pagination}
          filters={reportLogic.filters}
          setFilters={reportLogic.setFilters}
          fetchInventoryActivityLogs={fetchInventoryActivityLogs}
        />
      ) : (
        <CustomTypography variant="body1" sx={{ textAlign: 'center', padding: 2 }}>
          No inventory activity logs available.
        </CustomTypography>
      )}
    </ReportPageLayout>
  );
};

export default InventoryActivityLogPage;
