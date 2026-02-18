import { useEffect } from 'react';
import Stack from '@mui/material/Stack';
import {
  CustomDialog,
  ErrorMessage,
  Loading,
  NoDataFound,
} from '@components/index';
import {
  LocationTypeDetailInformationSection,
  LocationTypeDetailStatusSection,
  LocationTypeDetailAuditSection,
} from '@features/locationType/components/LocationTypeDetail';
import { useLocationTypeDetail } from '@hooks/index';

interface ViewLocationTypeDialogProps {
  open: boolean;
  locationTypeId: string | null;
  onClose: () => void;
}

/**
 * View-only dialog for Location Type details.
 *
 * Responsibilities:
 * - Fetch detail on open
 * - Reset state on close
 * - Render loading / error / empty states
 * - Display read-only sections
 */
const ViewLocationTypeDialog = ({
  open,
  locationTypeId,
  onClose,
}: ViewLocationTypeDialogProps) => {
  const {
    locationType,
    loading,
    error,
    isEmpty,
    fetchLocationTypeDetail,
    resetLocationTypeDetailState,
  } = useLocationTypeDetail();

  // Fetch when dialog opens
  useEffect(() => {
    if (open && locationTypeId) {
      fetchLocationTypeDetail(locationTypeId);
    }
  }, [open, locationTypeId, fetchLocationTypeDetail]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      resetLocationTypeDetailState();
    }
  }, [open, resetLocationTypeDetailState]);

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={locationType?.name ?? 'Location Type Details'}
      showCancelButton={false}
    >
      <Stack spacing={3}>
        {loading && (
          <Loading
            variant="dotted"
            message="Loading Location Type Details..."
          />
        )}

        {error && <ErrorMessage message={error} />}

        {isEmpty && <NoDataFound message="No location type details found." />}

        {locationType && (
          <>
            <LocationTypeDetailInformationSection locationType={locationType} />
            <LocationTypeDetailStatusSection locationType={locationType} />
            <LocationTypeDetailAuditSection locationType={locationType} />
          </>
        )}
      </Stack>
    </CustomDialog>
  );
};

export default ViewLocationTypeDialog;
