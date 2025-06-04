import { type FC } from 'react';
import BaseInventoryExpandedRow from '@features/inventoryShared/components/BaseInventoryExpandedRow';
import type { LocationInventoryRecord } from '../state';
import { getInventoryDetailsFields } from '@features/inventoryShared/utils/expandedRowFields';

interface Props {
  record: LocationInventoryRecord;
}

const LocationInventoryExpandedRow: FC<Props> = ({ record }) => {
  const { details, metadata } = getInventoryDetailsFields(record);
  
  return <BaseInventoryExpandedRow details={details} metadata={metadata} />;
};

export default LocationInventoryExpandedRow;
