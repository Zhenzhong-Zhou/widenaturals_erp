import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import NoDataFound from '@components/common/NoDataFound';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import GoBackButton from '@components/common/GoBackButton';
import type { WarehouseDetails } from '@features/warehouse/state';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import { handleAdjustmentReportRedirect } from '@utils/navigationUtils';

interface WarehouseDetailHeaderProps {
  warehouseDetails?: WarehouseDetails;
  loading?: boolean;
  refetch: () => void;
}

const WarehouseInventoryDetailHeader: FC<WarehouseDetailHeaderProps> = ({
  warehouseDetails,
  loading,
  refetch,
}) => {
  if (!warehouseDetails)
    return <NoDataFound message={' No warehouse selected.'} />;
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        mb: 3,
        textAlign: 'left',
        p: 2,
        bgcolor: 'background.default',
        borderRadius: 2,
      }}
    >
      {/* Warehouse Name */}
      <CustomTypography variant="h4" gutterBottom>
        {warehouseDetails.name}
      </CustomTypography>

      {/* Storage Capacity */}
      <CustomTypography variant="body1" color="textSecondary">
        Storage Capacity: {warehouseDetails.storageCapacity.toLocaleString()}{' '}
        units
      </CustomTypography>

      {/* Location Details */}
      {warehouseDetails.location && (
        <>
          {/* Location Type */}
          {warehouseDetails.location.locationType && (
            <CustomTypography variant="body1" color="textSecondary">
              Location Type: {warehouseDetails.location.locationType.name}
            </CustomTypography>
          )}

          <CustomTypography variant="body1" color="textSecondary">
            Location: {warehouseDetails.location.name}
          </CustomTypography>
          <CustomTypography variant="body1" color="textSecondary">
            Address: {warehouseDetails.location.address}
          </CustomTypography>
        </>
      )}

      {/* Warehouse Status */}
      {warehouseDetails.status?.name && (
        <CustomTypography
          variant="body1"
          color={
            warehouseDetails.status.name.toLowerCase() === 'active'
              ? 'success.main'
              : 'error.main'
          }
        >
          Status: {formatLabel(warehouseDetails.status.name)}
        </CustomTypography>
      )}

      {/* Metadata (Created By, Updated By) */}
      {warehouseDetails.metadata && (
        <CustomTypography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Created by: {warehouseDetails.metadata.createdBy ?? 'Unknown'} on{' '}
          {formatDate(warehouseDetails.metadata.createdAt ?? null)}
          <br />
          Last updated by: {warehouseDetails.metadata.updatedBy ??
            'Unknown'} on{' '}
          {formatDate(warehouseDetails.metadata.updatedAt ?? null)}
        </CustomTypography>
      )}
      <CustomButton onClick={refetch} disabled={loading}>
        Refresh Warehouse Data
      </CustomButton>
      <CustomButton
        onClick={() =>
          handleAdjustmentReportRedirect(
            navigate,
            'reports/adjustments',
            warehouseDetails.id
          )
        }
        disabled={loading}
      >
        View Warehouse Lot Adjustment
      </CustomButton>
      <GoBackButton />
    </Box>
  );
};

export default WarehouseInventoryDetailHeader;
