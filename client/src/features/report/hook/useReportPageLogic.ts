import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { handleDownload } from "@utils/downloadUtils.ts";
import { BaseReportParams } from '../state/reportTypes.ts';

interface UseReportPageLogicProps<T, R> {
  fetchData: (filters: Partial<T>) => void;
  exportData: Blob | null;
  exportFormat: string | null;
  reportCategory: string | null;
  exportLoading: boolean;
  exportError: string | null;
  data: R[];
  pagination: { totalPages: number; totalRecords: number; page: number; limit: number } | null;
}

const useReportPageLogic = <T extends BaseReportParams, R>({
                                 fetchData,
                                 exportData,
                                 exportFormat,
                                 reportCategory,
                                 exportLoading,
                                 exportError,
                                 data,
                                 pagination,
                               }: UseReportPageLogicProps<T, R>)  => {
  const { warehouseId, inventoryId, warehouseInventoryLotId } = useParams<{
    warehouseId?: string;
    inventoryId?: string;
    warehouseInventoryLotId?: string;
  }>();
  
  // 🛠️ State for filters
  const [filters, setFilters] = useState<Partial<T>>(
    ({
      exportFormat,
      reportType: "", // Default value or make it dynamic
      reportCategory,
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      startDate: null,
      endDate: null,
      warehouseId: warehouseId || null,
      inventoryId: inventoryId || null,
      warehouseInventoryLotId: warehouseInventoryLotId || null,
      page: 1,
      limit: 10,
    } as unknown) as Partial<T>
  );
  
  const [open, setOpen] = useState(false);
  
  // Fetch data whenever filters change
  useEffect(() => {
    fetchData(filters);
  }, [fetchData, filters]);
  
  // Memoize fetchData to prevent unnecessary re-renders
  useEffect(() => {
    if (!exportData || exportLoading) return;
    
    if (!(exportData instanceof Blob)) {
      console.error("Export data is not a Blob.");
      return;
    }
    
    // Report type mappings (weekly, monthly, yearly)
    const reportTypeMapping: Record<string, string> = {
      weekly: "weekly",
      monthly: "monthly",
      yearly: "yearly",
    };
    
    // Report category mappings (adjustment, inventory, history)
    const reportCategoryMapping: Record<string, string> = {
      adjustment: "Lot_Adjustment_Report",
      inventory_history: "Inventory_History",
      inventory_activity: "Inventory_Activity_Logs",
    };
    
    const filtersTyped = filters as Partial<BaseReportParams>;
    
    // Extract values with fallbacks
    const reportTypeKey = filtersTyped.reportType ?? "custom"; // Default: 'custom'
    const reportCategoryKey = filtersTyped.reportCategory ?? "Lot_Adjustment_Report"; // Default category (may not be in BaseReportParams)
    const reportCategory = reportCategoryMapping[reportCategoryKey] || "Report";
    const reportType = reportTypeMapping[reportTypeKey] || "custom";
    
    // Date Formatting
    const today = new Date();
    const formattedDate = ["weekly", "monthly", "yearly"].includes(reportType)
      ? reportType // Use report type for filename
      : `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    
    // Construct final file name
    const fileExtension = filters.exportFormat || "csv";
    const fileName = `${reportCategory}_${formattedDate}.${fileExtension}`;
    
    handleDownload(exportData, fileName);
  }, [exportData, exportFormat, exportLoading, filters]);
  
  
  return {
    filters,
    setFilters,
    open,
    setOpen,
    pagination: pagination ?? { totalPages: 1, totalRecords: 0, page: 1, limit: 10 }, // Ensure pagination has default values
    exportLoading,
    exportError,
    data,
  };
};

export default useReportPageLogic;
