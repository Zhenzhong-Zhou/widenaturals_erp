import { type FC, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { CustomTable, CustomTypography } from '@components/index';
import {
  FulfillmentBatchesMiniTable,
  outboundFulfillmentTableColumns,
  OutboundFulfillmentExpandedSection,
} from '@features/outboundFulfillment/components/OutboundShipmentDetails';
import type { FlattenedFulfillmentRow } from '@features/outboundFulfillment/state';

interface FulfillmentTableProps {
  data: FlattenedFulfillmentRow[];
  loading?: boolean;
  itemCount: number;
}

const FulfillmentDetailsTable: FC<FulfillmentTableProps> = ({
  data,
  loading,
  itemCount,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };

  const columns = useMemo(
    () => outboundFulfillmentTableColumns(expandedRowId, handleDrillDownToggle),
    [expandedRowId]
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <CustomTypography variant="h6" sx={{ fontWeight: 600 }}>
          Fulfillment Details
        </CustomTypography>
      </Box>

      <CustomTable
        columns={columns}
        data={data}
        loading={loading}
        page={0}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
        initialRowsPerPage={itemCount}
        rowsPerPageOptions={[itemCount]}
        getRowId={(row) => row.fulfillmentId ?? 'nobatch'}
        expandable
        expandedRowId={expandedRowId}
        expandedContent={(row) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            {/* Expanded fulfillment info */}
            <OutboundFulfillmentExpandedSection row={row} />

            {/* Mini table of batches */}
            <FulfillmentBatchesMiniTable data={row.batches ?? []} />
          </Box>
        )}
        emptyMessage="No fulfillemnt details found."
      />
    </Box>
  );
};

export default FulfillmentDetailsTable;
