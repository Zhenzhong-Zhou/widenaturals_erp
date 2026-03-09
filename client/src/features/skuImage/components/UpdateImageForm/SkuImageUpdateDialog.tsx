import { useEffect, useMemo, useRef, useState } from 'react';
import { CustomDialog, CustomTypography } from '@components/index';
import { SkuImageUpdateCard } from '@features/skuImage/components/UpdateImageForm/index';
import { useSkuImageUpdate } from '@hooks/index';
import type { SkuImageGroup } from '@features/sku';
import type {
  SkuImageType,
  SkuImageUpdateDraft,
} from '@features/skuImage/state';
import { buildUpdateFormData } from '@features/skuImage/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  skuId: string;
  skuCode: string;
  displayProductName: string;
  imageGroups: SkuImageGroup[];
  onSuccess?: () => void;
}

const SkuImageUpdateDialog = ({
  open,
  onClose,
  skuId,
  skuCode,
  displayProductName,
  imageGroups,
  onSuccess,
}: Props) => {
  const { loading, error, hasResults, isSuccess, updateImages, reset } =
    useSkuImageUpdate();

  // -------------------------------------------------------
  // Initialize Draft State from Existing Groups
  // -------------------------------------------------------
  const initialDrafts: SkuImageUpdateDraft[] = useMemo(() => {
    return imageGroups.map((group) => {
      const variantEntry = Object.entries(group.variants).find(
        ([, variant]) => variant
      );

      const imageType = variantEntry?.[0] as SkuImageType | undefined;

      return {
        group_id: group.groupId,
        image_type: imageType ?? 'main',
        is_primary: group.isPrimary,
      };
    });
  }, [imageGroups]);

  const [draftImages, setDraftImages] = useState<SkuImageUpdateDraft[]>([]);
  const initialDraftRef = useRef<SkuImageUpdateDraft[]>(initialDrafts);

  useEffect(() => {
    if (open) {
      initialDraftRef.current = initialDrafts;
      setDraftImages(initialDrafts);
    }
  }, [open, initialDrafts]);

  useEffect(() => {
    if (isSuccess && hasResults) {
      onSuccess?.();
      reset();
      onClose();
    }
  }, [isSuccess, hasResults, onSuccess, reset, onClose]);

  const getChangedDrafts = () => {
    return draftImages.filter((draft) => {
      // Always include if file present
      if (draft.file_uploaded && draft.file) {
        return true;
      }

      const original = initialDraftRef.current.find(
        (d) => d.group_id === draft.group_id
      );

      if (!original) return true;

      return (
        draft.image_url !== original.image_url ||
        draft.image_type !== original.image_type ||
        draft.display_order !== original.display_order ||
        draft.is_primary !== original.is_primary ||
        draft.alt_text !== original.alt_text
      );
    });
  };

  // -------------------------------------------------------
  // Submit Handler
  // -------------------------------------------------------
  const handleSubmit = async () => {
    try {
      const changedDrafts = getChangedDrafts();

      if (changedDrafts.length === 0) {
        onClose(); // nothing changed
        return;
      }

      const formData = buildUpdateFormData([
        {
          skuId,
          skuCode,
          images: changedDrafts,
        },
      ]);

      await updateImages(formData);
    } catch {
      // let slice handle error
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      title="Update SKU Images"
      confirmButtonText="Save Changes"
      onConfirm={handleSubmit}
      disableCloseOnBackdrop={loading}
      disableCloseOnEscape={loading}
    >
      <SkuImageUpdateCard
        displayProductName={displayProductName}
        skuCode={skuCode}
        groups={imageGroups}
        drafts={draftImages}
        onChange={setDraftImages}
      />

      {error && (
        <CustomTypography color="error" sx={{ mt: 2 }}>
          {error}
        </CustomTypography>
      )}
    </CustomDialog>
  );
};

export default SkuImageUpdateDialog;
