import { type FC, useMemo } from 'react';
import CustomMiniTable from '@components/common/CustomMiniTable';
import type { FlattenedBatchRow } from '@features/outboundFulfillment/state';
import {
  outboundFulfillmentBatchColumns
} from '@features/outboundFulfillment/components/OutboundShipmentDetails/OutboundFulfillmentTableColumns';

interface FulfillmentBatchesMiniTableProps {
  data: FlattenedBatchRow[];
}

const FulfillmentBatchesMiniTable: FC<FulfillmentBatchesMiniTableProps> = ({ data }) => {
  const columns = useMemo(() => outboundFulfillmentBatchColumns, []);
  
  return (
    <CustomMiniTable
      columns={columns}
      data={data}
      emptyMessage="No batch records found"
      dense
    />
  );
};

export default FulfillmentBatchesMiniTable;
