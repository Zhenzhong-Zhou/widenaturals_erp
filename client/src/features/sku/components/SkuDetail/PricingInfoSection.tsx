import { type FC, useCallback, useMemo, useState } from 'react';
import CustomMiniTable from '@components/common/CustomMiniTable';
import InfoPopover from '@components/common/InfoPopover';
import type { FlattenedPricingRecord } from '@features/sku/state';
import { createPricingColumns } from '@features/sku/components/SkuDetail/PricingColumns';
import { formatDateTime } from '@utils/dateTimeUtils';

interface PricingInfoSectionProps {
  data: FlattenedPricingRecord[];
}

const PricingInfoSection: FC<PricingInfoSectionProps> = ({ data }) => {
  /**
   * -------------------------------------
   *   STATE — Metadata Popover
   * -------------------------------------
   */
  const [metaAnchorEl, setMetaAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMeta, setSelectedMeta] = useState<FlattenedPricingRecord | null>(null);
  
  /**
   * -------------------------------------
   *   STATE — Audit Popover
   * -------------------------------------
   */
  const [auditAnchorEl, setAuditAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAudit, setSelectedAudit] = useState<FlattenedPricingRecord | null>(null);
  
  /**
   * -------------------------------------
   *   CALLBACKS
   * -------------------------------------
   */
  const openMetadata = useCallback(
    (row: FlattenedPricingRecord, target: HTMLElement) => {
      setMetaAnchorEl(target);
      setSelectedMeta(row);
    },
    []
  );
  
  const openAudit = useCallback(
    (row: FlattenedPricingRecord, target: HTMLElement) => {
      setAuditAnchorEl(target);
      setSelectedAudit(row);
    },
    []
  );
  
  const closeMetadata = useCallback(() => {
    setMetaAnchorEl(null);
    setSelectedMeta(null);
  }, []);
  
  const closeAudit = useCallback(() => {
    setAuditAnchorEl(null);
    setSelectedAudit(null);
  }, []);
  
  /**
   * -------------------------------------
   *   COLUMNS (memoized)
   * -------------------------------------
   */
  const columns = useMemo(
    () => createPricingColumns(openMetadata, openAudit),
    [openMetadata, openAudit]
  );
  
  /**
   * -------------------------------------
   *   FIELD SETS
   * -------------------------------------
   */
  const metadataFields = useMemo(() => {
    if (!selectedMeta) return [];
    
    return [
      { label: 'Location Type', value: selectedMeta.locationType },
      { label: 'Status Date', value: formatDateTime(selectedMeta.statusDate) },
    ];
  }, [selectedMeta]);
  
  const auditFields = useMemo(() => {
    if (!selectedAudit) return [];
    return [
      { label: 'Created By', value: selectedAudit.createdBy },
      { label: 'Created At', value: formatDateTime(selectedAudit.createdAt) },
      { label: 'Updated By', value: selectedAudit.updatedBy },
      { label: 'Updated At', value: formatDateTime(selectedAudit.updatedAt) },
    ];
  }, [selectedAudit]);
  
  /**
   * -------------------------------------
   *   RENDER
   * -------------------------------------
   */
  return (
    <>
      <CustomMiniTable
        columns={columns}
        data={data}
        emptyMessage="No pricing records"
        dense
      />
      
      {/* METADATA POPOVER */}
      <InfoPopover
        anchorEl={metaAnchorEl}
        open={Boolean(metaAnchorEl)}
        onClose={closeMetadata}
        title="Pricing Metadata"
        fields={metadataFields}
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

export default PricingInfoSection;
