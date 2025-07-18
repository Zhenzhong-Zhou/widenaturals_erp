import { type ComponentType, Suspense } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import ErrorMessage from '@components/common/ErrorMessage';

type DetailTableProps = {
  data: any[];
  page: number;
  totalRecords: number;
  totalPages: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (limit: number) => void;
};

interface ExpandableDetailSectionProps<T> {
  row: T;
  detailData?: any[];
  detailLoading: boolean;
  detailError: string | null;
  detailPage: number;
  detailTotalRecords: number;
  detailTotalPages: number;
  detailLimit: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (limit: number) => void;
  onRefreshDetail?: (itemId: string) => void;
  DetailTableComponent: ComponentType<DetailTableProps>;
}

const ExpandableDetailSection = <T extends { itemId: string }>({
  row,
  detailData,
  detailLoading,
  detailError,
  detailPage,
  detailTotalRecords,
  detailTotalPages,
  detailLimit,
  onPageChange,
  onRowsPerPageChange,
  onRefreshDetail,
  DetailTableComponent,
}: ExpandableDetailSectionProps<T>) => {
  if (!detailData && !detailLoading) {
    return (
      <Box sx={{ height: 120, p: 2 }}>
        <Skeleton variant="rectangular" height="100%" />
      </Box>
    );
  }

  if (detailError) {
    return <ErrorMessage message={detailError} />;
  }

  if (!detailData?.length && !detailLoading) {
    return (
      <CustomTypography sx={{ p: 2 }} variant="body2">
        No detail data available.
      </CustomTypography>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Suspense
        fallback={
          <Skeleton
            height={80}
            variant="rectangular"
            sx={{ borderRadius: 1, mb: 1 }}
          />
        }
      >
        <DetailTableComponent
          data={detailData ?? []}
          page={detailPage - 1}
          totalRecords={detailTotalRecords}
          totalPages={detailTotalPages}
          rowsPerPage={detailLimit}
          onPageChange={onPageChange ?? (() => {})}
          onRowsPerPageChange={onRowsPerPageChange ?? (() => {})}
        />
      </Suspense>

      {onRefreshDetail && (
        <Box mt={1}>
          <CustomButton
            size="small"
            onClick={() => onRefreshDetail(row.itemId)}
          >
            Refresh Details
          </CustomButton>
        </Box>
      )}
    </Box>
  );
};

export default ExpandableDetailSection;
