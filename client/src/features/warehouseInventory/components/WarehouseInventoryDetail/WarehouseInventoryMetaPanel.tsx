import { type FC } from 'react';
import { Card, Divider, Stack } from '@mui/material';
import { CustomTypography } from '@components/index';
import DetailField from './DetailField';
import type { GenericAudit } from '@shared-types/api';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

type WarehouseInventoryMetaPanelProps = {
  inboundDate: string | null;
  outboundDate: string | null;
  lastMovementAt: string | null;
  registeredAt: string | null;
  audit: GenericAudit | null;
};

const WarehouseInventoryMetaPanel: FC<WarehouseInventoryMetaPanelProps> = ({
                                                                             inboundDate,
                                                                             outboundDate,
                                                                             lastMovementAt,
                                                                             registeredAt,
                                                                             audit,
                                                                           }) => (
  <Stack spacing={3}>
    <Card sx={{ p: 3, borderRadius: 2 }}>
      <CustomTypography variant="subtitle1" fontWeight={600} mb={1.5}>
        Dates
      </CustomTypography>
      <Stack spacing={1}>
        <DetailField label="Inbound" value={formatDateTime(inboundDate)} />
        <DetailField label="Outbound" value={formatDateTime(outboundDate)} />
        <DetailField
          label="Last movement"
          value={formatDateTime(lastMovementAt)}
        />
        <DetailField label="Registered" value={formatDateTime(registeredAt)} />
      </Stack>
    </Card>
    
    <Card sx={{ p: 3, borderRadius: 2 }}>
      <CustomTypography variant="subtitle1" fontWeight={600} mb={1.5}>
        Audit
      </CustomTypography>
      {audit ? (
        <Stack spacing={1}>
          <DetailField label="Created by" value={formatLabel(audit.createdBy?.name)} />
          <DetailField label="Created at" value={formatDateTime(audit.createdAt)} />
          <Divider sx={{ my: 0.5 }} />
          <DetailField label="Updated by" value={formatLabel(audit.updatedBy?.name)} />
          <DetailField label="Updated at" value={formatDateTime(audit.updatedAt)} />
        </Stack>
      ) : (
        <CustomTypography variant="body2" color="text.secondary">
          No audit metadata available.
        </CustomTypography>
      )}
    </Card>
  </Stack>
);

export default WarehouseInventoryMetaPanel;
