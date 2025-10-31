import { type FC, useMemo, useState } from 'react';
import type { FlattenedFulfillmentRow } from '@features/outboundFulfillment/state';
import Box from '@mui/material/Box';
import CustomTable from '@components/common/CustomTable';
import CustomTypography from '@components/common/CustomTypography';
import {
  FulfillmentBatchesMiniTable,
  outboundFulfillmentTableColumns,
  OutboundFulfillmentExpandedSection,
} from '@features/outboundFulfillment/components/OutboundShipmentDetails';

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
  
  const columns = useMemo(() =>
    outboundFulfillmentTableColumns(expandedRowId, handleDrillDownToggle),
    [expandedRowId]);
  
  return (
   <Box>
     <Box
       display="flex"
       justifyContent="space-between"
       alignItems="center"
       mb={2}
     >
       <CustomTypography variant="h6" fontWeight={600}>
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
