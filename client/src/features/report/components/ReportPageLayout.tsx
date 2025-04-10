import { FC, ReactNode } from 'react';
import { BaseReportParams } from '@features/report';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import GoBackButton from '@components/common/GoBackButton';
import CustomTypography from '@components/common/CustomTypography';
import ReportFilters from '@features/report/components/ReportFilters';
import CustomButton from '@components/common/CustomButton';
import ExportReportModal from '@features/report/components/ExportReportModal';

interface ReportPageLayoutProps {
  title: string;
  subtitle: string;
  filters: any;
  setFilters: (filters: any) => void;
  fetchData: () => void;
  exportData: (filters?: Partial<BaseReportParams>) => void;
  exportLoading: boolean;
  exportError: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  children: ReactNode;
}

const ReportPageLayout: FC<ReportPageLayoutProps> = ({
  title,
  subtitle,
  filters,
  setFilters,
  fetchData,
  exportData,
  exportLoading,
  exportError,
  open,
  setOpen,
  children,
}) => {
  if (exportLoading) return <Loading message="Exporting report..." />;
  if (exportError)
    return (
      <ErrorDisplay>
        <ErrorMessage message={exportError} />
      </ErrorDisplay>
    );

  return (
    <Box sx={{ padding: 2, marginBottom: 3 }}>
      <GoBackButton />
      <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
        <CustomTypography variant="h4" component="h1" fontWeight="bold">
          {title}
        </CustomTypography>
        <CustomTypography variant="subtitle1" color="textSecondary">
          {subtitle}
        </CustomTypography>
      </Box>

      {/* Filters */}
      <ReportFilters filters={filters} setFilters={setFilters} />

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 2,
        }}
      >
        <CustomButton variant="outlined" onClick={fetchData}>
          Refresh Data
        </CustomButton>
        <CustomButton variant="contained" onClick={() => setOpen(true)}>
          Export Report
        </CustomButton>
        <ExportReportModal
          open={open}
          onClose={() => setOpen(false)}
          onExport={(exportFilters) => exportData(exportFilters)}
          filters={filters}
          setFilters={setFilters}
        />
      </Box>

      {/* Table Content */}
      {children}
    </Box>
  );
};

export default ReportPageLayout;
