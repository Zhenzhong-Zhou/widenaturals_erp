import { Box } from '@mui/material';
import { CustomTypography } from '@components/index';
import { formatLabel } from '@utils/textUtils';

export interface BatchUpdateStatusRowMetaData {
  isProduct: boolean;
  name: string | null | undefined;
  code: string | null | undefined;
  lotNumber: string | null | undefined;
  currentStatus: string | null | undefined;
}

interface BatchUpdateStatusRowTitleProps {
  meta: BatchUpdateStatusRowMetaData;
}

export const BatchUpdateStatusRowTitle = ({
  meta,
}: BatchUpdateStatusRowTitleProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
    <CustomTypography
      variant="subtitle1"
      fontWeight={700}
      sx={{ lineHeight: 1.2 }}
    >
      {meta.name ?? '—'}
    </CustomTypography>

    <CustomTypography
      variant="caption"
      color="text.secondary"
      sx={{ fontFamily: 'monospace', letterSpacing: 0.2 }}
    >
      {meta.code ?? '—'} · {meta.isProduct ? 'Product' : 'Packaging'} ·{' '}
      {meta.lotNumber ?? '—'}
    </CustomTypography>
  </Box>
);

interface BatchUpdateStatusCurrentStatusProps {
  meta: BatchUpdateStatusRowMetaData;
}

export const BatchUpdateStatusCurrentStatus = ({
  meta,
}: BatchUpdateStatusCurrentStatusProps) => (
  <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
    <Box>
      <CustomTypography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block' }}
      >
        Current Status
      </CustomTypography>

      <CustomTypography variant="body2" fontWeight={600}>
        {meta.currentStatus ? formatLabel(meta.currentStatus) : '—'}
      </CustomTypography>
    </Box>
  </Box>
);
