import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDate } from '@utils/dateTimeUtils';
import type { OrderItem } from '@features/order/state';
import { formatLabel } from '@utils/textUtils';
import Stack from '@mui/material/Stack';

interface Props {
  row: OrderItem;
}

interface ConflictNote {
  timestamp: string;
  data: Record<string, any>;
}

interface OrderItemMetadata {
  reason?: string;
  db_price?: number;
  submitted_price?: number;
  conflictNote?: ConflictNote;
}

const OrderItemDetailSection: FC<Props> = ({ row }) => {
  const transformMetadata = (raw: any): OrderItemMetadata | null => {
    if (!raw) return null;

    const { reason, db_price, submitted_price, data, timestamp } = raw;

    const conflictNote = data && timestamp ? { timestamp, data } : undefined;

    return {
      reason,
      db_price,
      submitted_price,
      conflictNote,
    };
  };

  const metadata = transformMetadata(row?.metadata);

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Item Metadata
      </CustomTypography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsSection
            fields={[
              {
                label: 'Created At',
                value: row.audit?.createdAt,
                format: formatDate,
              },
              {
                label: 'Created By',
                value: row.audit?.createdBy?.name,
                format: formatLabel,
              },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsSection
            fields={[
              {
                label: 'Updated At',
                value: row.audit?.updatedAt,
                format: formatDate,
              },
              {
                label: 'Updated By',
                value: row.audit?.updatedBy?.name,
                format: formatLabel,
              },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <DetailsSection
            fields={[
              { label: 'Reason', value: metadata?.reason ?? '—' },
              {
                label: 'DB Price',
                value:
                  metadata?.db_price != null ? `$${metadata.db_price}` : '—',
              },
              {
                label: 'Submitted Price',
                value:
                  metadata?.submitted_price != null
                    ? `$${metadata.submitted_price}`
                    : '—',
              },
              metadata?.conflictNote
                ? {
                    label: 'Conflict',
                    value: metadata?.conflictNote ?? null,
                    format: (val: ConflictNote) =>
                      val && (
                        <Box>
                          <CustomTypography
                            variant="subtitle2"
                            sx={{ fontWeight: 500, mb: 0.5 }}
                          >
                            [{val.timestamp}]
                          </CustomTypography>
                          <Stack spacing={0.25} sx={{ pl: 1 }}>
                            {Object.entries(val.data).map(([key, value]) => (
                              <CustomTypography
                                key={key}
                                variant="subtitle2"
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {key}: {String(value)}
                              </CustomTypography>
                            ))}
                          </Stack>
                        </Box>
                      ),
                  }
                : null,
            ].filter(
              (field): field is { label: string; value: string } =>
                field !== null
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderItemDetailSection;
