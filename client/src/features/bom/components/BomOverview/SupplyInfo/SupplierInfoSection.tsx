import type { FC } from 'react';
import type { FlattenedBomSupplyRow } from '@features/bom/state';
import DetailsSection from '@components/common/DetailsSection';
import { formatCurrency } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';

const SupplierInfoSection: FC<{ row: FlattenedBomSupplyRow }> = ({ row }) => (
  <DetailsSection
    sectionTitle="Supplier Information"
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      bgcolor: 'background.paper',
      p: 1.5,
    }}
    fields={[
      { label: 'Contract Currency', value: row.supplierContractCurrency },
      {
        label: 'Contract Unit Cost',
        value: row.supplierContractUnitCost,
        format: (v) => formatCurrency(v, row.supplierContractCurrency),
      },
      {
        label: 'Contract Exchanged Rate',
        value: row.supplierContractExchangeRate,
      },
      {
        label: 'Contract Valid From',
        value: row.supplierContractValidFrom,
        format: formatDate,
      },
      {
        label: 'Contract Valid To',
        value: row.supplierContractValidTo,
        format: formatDate,
      },
      { label: 'Supplier Note', value: row.supplierNote },
      { label: 'Supplier Created At', value: row.supplierCreatedAt },
      { label: 'Supplier Created By', value: row.supplierCreatedBy },
      { label: 'Supplier Updated At', value: row.supplierUpdatedAt },
      { label: 'Supplier Updated By', value: row.supplierUpdatedBy },
    ]}
  />
);

export default SupplierInfoSection;
