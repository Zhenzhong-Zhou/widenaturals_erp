import { type FC, useCallback, useMemo, useState } from 'react';
import CustomMiniTable from '@components/common/CustomMiniTable';
import InfoPopover from '@components/common/InfoPopover';
import type { FlattenedComplianceRecord } from '@features/sku/state';
import { createComplianceColumns } from '@features/sku/components/SkuDetail';
import { formatDateTime } from '@utils/dateTimeUtils';

interface ComplianceInfoSectionProps {
  data: FlattenedComplianceRecord[];
}

/**
 * Renders a compact table of compliance records.
 *
 * No memoization needed for `ComplianceColumns` because it is a stable
 * module-level constant, which is already optimal for performance.
 */
const ComplianceInfoSection: FC<ComplianceInfoSectionProps> = ({ data }) => {
  // ----------------------------
  // STATE (Description popover)
  // ----------------------------
  const [descAnchorEl, setDescAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDesc, setSelectedDesc] =
    useState<FlattenedComplianceRecord | null>(null);

  // ----------------------------
  // STATE (Audit popover)
  // ----------------------------
  const [auditAnchorEl, setAuditAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAudit, setSelectedAudit] =
    useState<FlattenedComplianceRecord | null>(null);

  // ----------------------------
  // CALLBACKS
  // ----------------------------
  const openAudit = useCallback(
    (row: FlattenedComplianceRecord, target: HTMLElement) => {
      setAuditAnchorEl(target);
      setSelectedAudit(row);
    },
    []
  );

  const openDescription = useCallback(
    (row: FlattenedComplianceRecord, target: HTMLElement) => {
      setDescAnchorEl(target);
      setSelectedDesc(row);
    },
    []
  );

  const closeAudit = useCallback(() => {
    setAuditAnchorEl(null);
    setSelectedAudit(null);
  }, []);

  const closeDescription = useCallback(() => {
    setDescAnchorEl(null);
    setSelectedDesc(null);
  }, []);

  // ----------------------------
  // COLUMNS (memoized for performance)
  // ----------------------------
  const columns = useMemo(
    () => createComplianceColumns(openAudit, openDescription),
    [openAudit, openDescription]
  );

  // ----------------------------
  // FIELD SETS
  // ----------------------------
  const descriptionFields = useMemo(() => {
    if (!selectedDesc) return [];

    return [{ label: 'Description', value: selectedDesc.description }];
  }, [selectedDesc]);

  const auditFields = useMemo(() => {
    if (!selectedAudit) return [];

    return [
      { label: 'Created By', value: selectedAudit.createdBy },
      { label: 'Created At', value: formatDateTime(selectedAudit.createdAt) },
      { label: 'Updated By', value: selectedAudit.updatedBy },
      { label: 'Updated At', value: formatDateTime(selectedAudit.updatedAt) },
    ];
  }, [selectedAudit]);

  return (
    <>
      <CustomMiniTable
        columns={columns}
        data={data}
        emptyMessage="No compliance records"
        dense
      />

      {/* DESCRIPTION POPOVER */}
      <InfoPopover
        anchorEl={descAnchorEl}
        open={Boolean(descAnchorEl)}
        onClose={closeDescription}
        title="Compliance Description"
        fields={descriptionFields}
      />

      {/* AUDIT POPOVER */}
      <InfoPopover
        anchorEl={auditAnchorEl}
        open={Boolean(auditAnchorEl)}
        onClose={closeAudit}
        title="Audit Info"
        fields={auditFields}
      />
    </>
  );
};

export default ComplianceInfoSection;
