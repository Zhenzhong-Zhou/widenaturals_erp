import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import {
  SkuImageDropzone,
  SkuImagePreviewItem,
} from '@features/skuImage/components/UploadImageForm';
import {
  SkuImageInput,
  SkuImageUploadCardData,
} from '@features/skuImage/state';
import { getImageFileFormat } from '@features/skuImage/utils/imageFormatUtils';

interface Props {
  data: SkuImageUploadCardData;
  onChange: (next: Props['data']) => void;
}

const SkuImageUploadCard = ({ data, onChange }: Props) => {
  const { displayProductName, skuCode, images } = data;

  // -------------------------------------------------------
  // Local State
  // -------------------------------------------------------
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');

  // -------------------------------------------------------
  // Handlers
  // -------------------------------------------------------
  const handleFilesAdded = useCallback(
    (files: File[]) => {
      if (uploadMode !== 'file') return;

      const newImages: SkuImageInput[] = files.map((file) => ({
        file_uploaded: true,
        file,
        image_type: 'thumbnail',
        alt_text: '',
        previewUrl: URL.createObjectURL(file),
        file_size_kb: Math.round(file.size / 1024),
        file_format: getImageFileFormat(file),
        source: 'uploaded',
      }));

      onChange({ ...data, images: [...images, ...newImages] });
    },
    [uploadMode, images, data, onChange]
  );

  const updateImage = useCallback(
    (idx: number, next: SkuImageInput) => {
      const clone = [...images];
      clone[idx] = next;
      onChange({ ...data, images: clone });
    },
    [images, data, onChange]
  );

  const removeImage = useCallback(
    (idx: number) => {
      onChange({ ...data, images: images.filter((_, i) => i !== idx) });
    },
    [images, data, onChange]
  );

  const addUrlImage = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    const newImage: SkuImageInput = {
      upload_mode: 'url',
      image_url: trimmed,
      file_uploaded: false,
      image_type: 'thumbnail',
      alt_text: '',
    };

    onChange({ ...data, images: [...images, newImage] });
    setUrlInput('');
  }, [urlInput, images, data, onChange]);

  // -------------------------------------------------------
  // UI Layout
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
      {/* --------------------------------------------------- */}
      {/* Header Section (Product Info)                      */}
      {/* --------------------------------------------------- */}
      <Box sx={{ mb: 2 }}>
        <CustomTypography variant="h6" fontWeight={700}>
          {displayProductName}
        </CustomTypography>
        <CustomTypography variant="body2" color="text.secondary">
          SKU: {skuCode}
        </CustomTypography>
      </Box>

      {/* --------------------------------------------------- */}
      {/* Upload Mode Selector                                */}
      {/* --------------------------------------------------- */}
      <TextField
        select
        label="Upload Mode"
        size="small"
        value={uploadMode}
        onChange={(e) => setUploadMode(e.target.value as 'file' | 'url')}
        sx={{ width: 200, mb: 2 }}
      >
        <MenuItem value="file">Upload File</MenuItem>
        <MenuItem value="url">Use Image URL</MenuItem>
      </TextField>

      {/* --------------------------------------------------- */}
      {/* Upload Input (File or URL)                          */}
      {/* --------------------------------------------------- */}
      {uploadMode === 'file' && (
        <SkuImageDropzone onFilesAdded={handleFilesAdded} />
      )}

      {uploadMode === 'url' && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Image URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <CustomButton variant="contained" onClick={addUrlImage}>
            Add
          </CustomButton>
        </Box>
      )}

      {/* --------------------------------------------------- */}
      {/* Image Preview List                                  */}
      {/* --------------------------------------------------- */}
      <Box sx={{ mt: 2 }}>
        {images.map((img, idx) => (
          <SkuImagePreviewItem
            key={idx}
            image={img}
            index={idx}
            onChange={(next) => updateImage(idx, next)}
            onRemove={() => removeImage(idx)}
          />
        ))}
      </Box>
    </Card>
  );
};

export default SkuImageUploadCard;
