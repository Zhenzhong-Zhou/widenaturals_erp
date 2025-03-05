import { FC, ReactNode } from "react";
import Box from "@mui/material/Box";
import {
  CustomButton,
  ErrorDisplay,
  ErrorMessage,
  GoBackButton,
  Loading,
  Typography,
} from "@components/index.ts";
import { AdjustmentReportFilters, ExportAdjustmentReportModal } from "../index.ts";

interface ReportPageLayoutProps {
  title: string;
  subtitle: string;
  filters: any;
  setFilters: (filters: any) => void;
  fetchData: () => void;
  exportData: () => void;
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
      <Box sx={{ textAlign: "center", marginBottom: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          {subtitle}
        </Typography>
      </Box>
      
      {/* Filters */}
      <AdjustmentReportFilters filters={filters} setFilters={setFilters} />
      
      {/* Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <CustomButton variant="outlined" onClick={fetchData}>
          Refresh Data
        </CustomButton>
        <CustomButton variant="contained" onClick={() => setOpen(true)}>
          Export Report
        </CustomButton>
        <ExportAdjustmentReportModal open={open} onClose={() => setOpen(false)} onExport={exportData} filters={filters} />
      </Box>
      
      {/* Table Content */}
      {children}
    </Box>
  );
};

export default ReportPageLayout;
