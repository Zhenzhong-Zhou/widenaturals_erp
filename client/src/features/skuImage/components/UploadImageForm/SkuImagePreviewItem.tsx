import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import { CustomTypography } from '@components/index';
import type { SkuImageType, SkuImageUiBase } from '@features/skuImage';
import { formatImageUrl } from '@utils/formatImageUrl';

interface Props<T extends SkuImageUiBase> {
  image: T;
  index: number;
  onChange: (next: T) => void;
  onRemove: () => void;
}

const SkuImagePreviewItem = <T extends SkuImageUiBase>({
                                                         image,
                                                         index,
                                                         onChange,
                                                         onRemove,
                                                       }: Props<T>) => {
  const handleField = <K extends keyof T>(field: K, value: T[K]) => {
    onChange({ ...image, [field]: value });
  };
  
  const imageSrc =
    image.previewUrl ??
    (image.image_url
      ? formatImageUrl(image.image_url)
      : null);
  
  return (
    <Card sx={{ display: 'flex', p: 2, gap: 2, mb: 2 }}>
      {/* Image Preview */}
      {imageSrc && (
        <CardMedia
          component="img"
          src={imageSrc}
          alt={image.alt_text ?? 'preview'}
          sx={{
            width: 120,
            height: 120,
            borderRadius: 2,
            objectFit: 'cover',
            border: '1px solid #ccc',
          }}
        />
      )}

      {/* Editable Fields */}
      <Box
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        <CustomTypography variant="body2" fontWeight={600}>
          Image {index + 1}
        </CustomTypography>

        {/* Image Source Mode ----------------------------------- */}
        {image.upload_mode === 'url' && (
          <TextField
            label="Image URL"
            value={image.image_url ?? ''}
            onChange={(e) => {
              handleField('image_url', e.target.value);
              handleField('file_uploaded', false); // switching to URL mode
            }}
            size="small"
            fullWidth
            disabled={!!image.image_url} // disable URL when file is present
            placeholder="https://example.com/image.jpg"
          />
        )}

        {/* File Upload ----------------------------------------- */}
        <Box sx={{ mt: 1 }}>
          {/* File Details Preview */}
          {image.file && (
            <Box
              sx={{ mt: 1, p: 1, border: '1px solid #ccc', borderRadius: 1 }}
            >
              <CustomTypography variant="body2">
                <strong>File:</strong> {image.file.name}
              </CustomTypography>
              <CustomTypography variant="body2">
                <strong>Size:</strong> {(image.file.size / 1024).toFixed(1)} KB
              </CustomTypography>
            </Box>
          )}
        </Box>
        
        <TextField
          label="Image Type"
          value={image.image_type ?? ''}
          onChange={(e) =>
            handleField('image_type', e.target.value as SkuImageType)
          }
          select
          size="small"
          fullWidth
        >
          <MenuItem value="main">Main</MenuItem>
          <MenuItem value="thumbnail">Thumbnail</MenuItem>
          <MenuItem value="zoom">Zoom</MenuItem>
        </TextField>

        <TextField
          label="Alt Text"
          size="small"
          fullWidth
          value={image.alt_text ?? ''}
          onChange={(e) => handleField('alt_text', e.target.value)}
        />
      </Box>

      {/* Delete */}
      <IconButton color="error" onClick={onRemove}>
        <DeleteIcon />
      </IconButton>
    </Card>
  );
};

export default SkuImagePreviewItem;
