import { FC } from 'react';
import useAdjustmentReport from '@hooks/useAdjustmentReport';
import useReportPageLogic from '@features/report/hook/useReportPageLogic';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import ReportPageLayout from '@features/report/components/ReportPageLayout';
import AdjustmentReportTable from '@features/report/components/AdjustmentReportTable';
import Typography from '@components/common/Typography';

const AdjustmentReportPage: FC = () => {
  const reportCategory = 'adjustment';

  const {
    data,
    loading,
    error,
    pagination,
    fetchReport,
    exportReport,
    exportData,
    exportFormat,
    exportLoading,
    exportError,
  } = useAdjustmentReport();

  const reportLogic = useReportPageLogic({
    fetchData: fetchReport,
    exportData,
    exportFormat,
    reportCategory,
    exportLoading,
    exportError,
    data,
    pagination,
  });

  if (loading) return <Loading message="Loading report..." />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );

  return (
    <ReportPageLayout
      title="Adjustment Report"
      subtitle="Warehouse & Inventory Adjustments"
      {...reportLogic}
      fetchData={() => fetchReport(reportLogic.filters)}
      exportData={() =>
        exportReport({
          ...reportLogic.filters,
          reportCategory: reportLogic.filters.reportCategory,
          exportFormat: reportLogic.filters.exportFormat,
        })
      }
    >
      {Array.isArray(data) && data.length > 0 ? (
        <AdjustmentReportTable
          data={data}
          pagination={reportLogic.pagination}
          filters={reportLogic.filters}
          setFilters={reportLogic.setFilters}
          fetchReport={fetchReport}
        />
      ) : (
        <Typography variant="body1" sx={{ textAlign: 'center', padding: 2 }}>
          No adjustment records available.
        </Typography>
      )}
    </ReportPageLayout>
  );
};

export default AdjustmentReportPage;
