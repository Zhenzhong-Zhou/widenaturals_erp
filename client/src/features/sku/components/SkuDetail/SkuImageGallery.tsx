import {
  type FC,
  type MouseEvent,
  useState,
  useMemo,
  useCallback,
} from 'react';
import Box from '@mui/material/Box';
import CardMedia from '@mui/material/CardMedia';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ZoomImageDialog from '@components/common/ZoomImageDialog';
import CustomTypography from '@components/common/CustomTypography';
import ImageMetadataPopover from '@components/common/ImageMetadataPopover';
import { formatImageUrl } from '@utils/formatImageUrl';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { SkuImage } from '@features/sku/state/skuTypes';
import {
  buildImageMetadataFields,
  normalizeSkuImages,
} from '@features/sku/utils/skuImageUtils';
import { flattenImageMetadata } from '@features/sku/utils/flattenSkuDetailData';

interface Props {
  images: SkuImage[];
  thumbnails?: SkuImage[];
  primaryImage: SkuImage | null;
}

const THUMB_SIZE = 72;

const SkuImageGallery: FC<Props> = ({ images, thumbnails, primaryImage }) => {
  /* ----------------------------------------------------------------------- */
  /* LOCAL STATE                                                             */
  /* ----------------------------------------------------------------------- */

  // Zoom dialog state
  const [zoomOpen, setZoomOpen] = useState(false);

  // Metadata popover state
  const [metaAnchorEl, setMetaAnchorEl] = useState<null | HTMLElement>(null);
  const [metaOpen, setMetaOpen] = useState(false);

  /* ----------------------------------------------------------------------- */
  /* METADATA POPOVER HANDLERS                                               */
  /* ----------------------------------------------------------------------- */

  const openMetadata = (event: MouseEvent<HTMLElement>) => {
    setMetaAnchorEl(event.currentTarget);
    setMetaOpen(true);
  };

  const closeMetadata = () => {
    setMetaOpen(false);
    setMetaAnchorEl(null);
  };

  /* ----------------------------------------------------------------------- */
  /* NORMALIZATION & IMAGE GROUPING                                          */
  /* ----------------------------------------------------------------------- */
  // Normalize images into: main, zoom, thumbnail. Memoized for performance.
  const {
    thumbnails: normalizedThumbs,
    mainImage,
    zoomImage,
  } = useMemo(() => normalizeSkuImages(images), [images]);

  /* ----------------------------------------------------------------------- */
  /* FINAL THUMBNAIL SOURCE                                                  */
  /* ----------------------------------------------------------------------- */
  // External thumbnails override normalized ones if provided.
  const thumbnailsToUse = thumbnails?.length ? thumbnails : normalizedThumbs;

  /* ----------------------------------------------------------------------- */
  /* SELECTED IMAGE LOGIC                                                    */
  /* ----------------------------------------------------------------------- */
  // Initialize selected image: prefer normalized main → fallback to provided primaryImage
  const [selected, setSelected] = useState<SkuImage | null>(
    mainImage ?? primaryImage
  );

  // Determine final image displayed on the large preview
  const displayImage = selected ?? mainImage ?? primaryImage;

  /* ----------------------------------------------------------------------- */
  /* IMAGE URL PROCESSING                                                    */
  /* ----------------------------------------------------------------------- */
  // URL for the main displayed image
  const displayUrl = useMemo(
    () => formatImageUrl(displayImage?.imageUrl ?? null),
    [displayImage]
  );

  // URL for zoom image: prefer dedicated zoom image → fallback to displayed image
  const zoomUrl = useMemo(
    () => formatImageUrl(zoomImage?.imageUrl ?? displayImage?.imageUrl ?? null),
    [zoomImage, displayImage]
  );

  /* ----------------------------------------------------------------------- */
  /* METADATA: FLATTEN + FORMAT                                              */
  /* ----------------------------------------------------------------------- */
  // Flatten raw image metadata for popovers & detail fields
  const flatImage = flattenImageMetadata(displayImage);

  // Apply formatting / custom label mapping for UI
  const metadataFields = buildImageMetadataFields(flatImage, {
    type: (v) => formatLabel(v),
    uploadedAt: (v) => formatDateTime(v),
  });

  /* ----------------------------------------------------------------------- */
  /* THUMBNAIL CLICK HANDLER                                                 */
  /* ----------------------------------------------------------------------- */
  const handleThumbClick = useCallback((img: SkuImage) => {
    setSelected(img);
  }, []);

  return (
    <Box display="flex" gap={2} alignItems="flex-start" width="100%">
      {/* Thumbnail Column */}
      <Stack
        direction="column"
        spacing={1}
        sx={{
          width: THUMB_SIZE + 10,
          maxHeight: 450,
          overflowY: 'auto',
          pr: 1,
        }}
      >
        {thumbnailsToUse.map((img) => {
          const isSelected = img.id === displayImage?.id;

          return (
            <Box
              key={img.id}
              onClick={() => handleThumbClick(img)}
              sx={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: 2,
                border: isSelected ? '2px solid #1976d2' : '1px solid #ccc',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: '#1976d2' },
              }}
            >
              <CardMedia
                component="img"
                image={formatImageUrl(img.imageUrl)}
                alt={img.altText}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: '#fafafa',
                }}
              />
            </Box>
          );
        })}
      </Stack>

      {/* Main Image Container */}
      <Box
        flex={1}
        textAlign="center"
        sx={{ position: 'relative' }} // <— enable absolute positioning
      >
        {/* INFO ICON OVERLAY */}
        <Tooltip title="Image Metadata">
          <IconButton
            size="small"
            onClick={openMetadata}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(255,255,255,0.8)',
              '&:hover': { backgroundColor: 'white' },
            }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* MAIN IMAGE */}
        <CardMedia
          component="img"
          image={displayUrl}
          alt={displayImage?.altText}
          onClick={() => zoomImage && setZoomOpen(true)}
          sx={{
            maxWidth: '100%',
            maxHeight: 550,
            objectFit: 'contain',
            borderRadius: 2,
            cursor: zoomImage ? 'zoom-in' : 'default',
          }}
        />

        <CustomTypography
          variant="caption"
          color="text.secondary"
          mt={1}
          display="block"
        >
          Click image to zoom
        </CustomTypography>
      </Box>

      {/* Zoom Modal */}
      <ZoomImageDialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        imageUrl={zoomUrl}
        altText={zoomImage?.altText ?? displayImage?.altText}
      />

      <ImageMetadataPopover
        anchorEl={metaAnchorEl}
        open={metaOpen}
        onClose={closeMetadata}
        title="Image Metadata"
        fields={metadataFields}
      />
    </Box>
  );
};

export default SkuImageGallery;
