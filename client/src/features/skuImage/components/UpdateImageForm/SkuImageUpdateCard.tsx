import { useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CustomTypography from '@components/common/CustomTypography';
import {
  SkuImageDropzone,
  SkuImagePreviewItem,
} from '@features/skuImage/components/UploadImageForm';
import type { SkuImageGroup } from '@features/sku';
import type {
  SkuImageUpdateDraft,
} from '@features/skuImage/state';
import { getImageFileFormat } from '@features/skuImage/utils/imageFormatUtils';

interface Props {
  displayProductName: string;
  skuCode: string;
  groups: SkuImageGroup[];
  drafts: SkuImageUpdateDraft[];
  onChange: (next: SkuImageUpdateDraft[]) => void;
}

const SkuImageUpdateCard = ({
                              displayProductName,
                              skuCode,
                              groups,
                              drafts,
                              onChange,
                            }: Props) => {
  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  
  const updateDraft = useCallback(
    (idx: number, next: SkuImageUpdateDraft) => {
      const clone = [...drafts];
      clone[idx] = next;
      onChange(clone);
    },
    [drafts, onChange]
  );
  
  const removeDraft = useCallback(
    (idx: number) => {
      onChange(drafts.filter((_, i) => i !== idx));
    },
    [drafts, onChange]
  );
  
  const handleFileReplace = useCallback(
    (idx: number, file: File) => {
      const clone = [...drafts];
      const current = clone[idx];
      if (!current) return;
      
      clone[idx] = {
        ...current,
        upload_mode: 'file',
        file_uploaded: true,
        file,
        previewUrl: URL.createObjectURL(file),
        file_size_kb: Math.round(file.size / 1024),
        file_format: getImageFileFormat(file),
        source: 'uploaded',
      };
      
      onChange(clone);
    },
    [drafts, onChange]
  );
  
  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  
  return (
    <Card
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <CustomTypography variant="h6" fontWeight={700}>
          {displayProductName}
        </CustomTypography>
        <CustomTypography variant="body2" color="text.secondary">
          SKU: {skuCode}
        </CustomTypography>
      </Box>
      
      {/* Per-Image Rendering */}
      <Box sx={{ mt: 2 }}>
        {drafts.map((draft, idx) => {
          const group = groups.find(
            (g) => g.groupId === draft.group_id
          );
          
          const previewVariant =
            group?.variants.thumbnail ??
            group?.variants.main ??
            group?.variants.zoom;
          
          const mergedImage = {
            ...draft,
            image_url:
              draft.previewUrl ??
              draft.image_url ??
              previewVariant?.imageUrl,
            alt_text:
              draft.alt_text ??
              previewVariant?.altText,
          };
          
          return (
            <Box key={draft.group_id} sx={{ mb: 3 }}>
              
              {/* Replace Mode */}
              <TextField
                select
                size="small"
                label="Replace Mode"
                value={draft.upload_mode ?? ''}
                onChange={(e) =>
                  updateDraft(idx, {
                    ...draft,
                    upload_mode: e.target.value as 'file' | 'url',
                  })
                }
                sx={{ width: 200, mb: 2 }}
              >
                <MenuItem value="file">Replace File</MenuItem>
                <MenuItem value="url">Replace with URL</MenuItem>
              </TextField>
              
              {/* Replace Controls */}
              {draft.upload_mode === 'file' && (
                <SkuImageDropzone
                  onFilesAdded={(files) => {
                    if (files[0]) {
                      handleFileReplace(idx, files[0]);
                    }
                  }}
                />
              )}
              
              {draft.upload_mode === 'url' && (
                <TextField
                  fullWidth
                  size="small"
                  label="New Image URL"
                  value={draft.image_url ?? ''}
                  onChange={(e) =>
                    updateDraft(idx, {
                      ...draft,
                      image_url: e.target.value,
                      file_uploaded: false,
                      file: null,
                      previewUrl: undefined,
                    })
                  }
                />
              )}
              
              <SkuImagePreviewItem
                image={mergedImage}
                index={idx}
                onChange={(next) => updateDraft(idx, next)}
                onRemove={() => removeDraft(idx)}
              />
            
            </Box>
          );
        })}
      </Box>
    </Card>
  );
};

export default SkuImageUpdateCard;
