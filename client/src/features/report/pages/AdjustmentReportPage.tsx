import { FC } from "react";
import { useAdjustmentReport } from "../../../hooks";
import { AdjustmentReportTable, ReportPageLayout, useReportPageLogic } from '../index.ts';
import { ErrorDisplay, ErrorMessage, Loading, NoDataFound } from '@components/index.ts';

const AdjustmentReportPage: FC = () => {
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
  if (!data || data.length === 0)
    return <NoDataFound message="No adjustment records found." />;
  
  return (
    <ReportPageLayout title="Adjustment Report" subtitle="Warehouse & Inventory Adjustments" {...reportLogic} fetchData={() => fetchReport(reportLogic.filters)} exportData={() => exportReport(reportLogic.filters)}>
      <AdjustmentReportTable data={data} pagination={reportLogic.pagination} filters={reportLogic.filters} setFilters={reportLogic.setFilters} fetchReport={fetchReport} />
    </ReportPageLayout>
  );
};

export default AdjustmentReportPage;
