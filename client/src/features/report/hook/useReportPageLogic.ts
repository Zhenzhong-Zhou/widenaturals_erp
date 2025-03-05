import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { handleDownload } from "@utils/downloadUtils.ts";

interface UseReportPageLogicProps<T> {
  fetchData: (filters: any) => void;
  exportData: any;
  exportFormat: string | null;
  exportLoading: boolean;
  exportError: string | null;
  data: T[];
  pagination: any;
}

const useReportPageLogic = <T>({
                                        fetchData,
                                        exportData,
                                        exportFormat,
                                        exportLoading,
                                        exportError,
                                        data,
                                        pagination,
                                      }: UseReportPageLogicProps<T>) => {
  const { warehouseId, inventoryId, warehouseInventoryLotId } = useParams<{
    warehouseId?: string;
    inventoryId?: string;
    warehouseInventoryLotId?: string;
  }>();
  
  const [filters, setFilters] = useState({
    reportType: null,
    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    startDate: null,
    endDate: null,
    warehouseId: warehouseId || null,
    inventoryId: inventoryId || null,
    warehouseInventoryLotId: warehouseInventoryLotId || null,
    page: 1,
    limit: 10,
  });
  
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);
  
  useEffect(() => {
    if (!exportData) return;
    
    const fileExtension = exportFormat || "csv";
    const formattedDate = new Date().toISOString().slice(0, 10);
    const fileName = `Report_${formattedDate}.${fileExtension}`;
    
    handleDownload(exportData, fileName);
  }, [exportData, exportFormat]);
  
  return {
    filters,
    setFilters,
    open,
    setOpen,
    pagination: pagination || { totalPages: 1, totalRecords: 0, page: 1, limit: 10 },
    exportLoading,
    exportError,
    data,
  };
};

export default useReportPageLogic;
