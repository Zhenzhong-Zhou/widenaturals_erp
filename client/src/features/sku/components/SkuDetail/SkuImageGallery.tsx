import {
  type FC,
  type MouseEvent,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import { alpha, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CardMedia from '@mui/material/CardMedia';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ZoomImageDialog from '@components/common/ZoomImageDialog';
import CustomTypography from '@components/common/CustomTypography';
import ImageMetadataPopover from '@components/common/ImageMetadataPopover';
import { ThumbnailList } from '@features/sku/components/SkuDetail';
import { formatImageUrl } from '@utils/formatImageUrl';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { SkuImage } from '@features/sku/state/skuTypes';
import {
  buildImageMetadataFields,
  flattenImageMetadata,
  normalizeSkuImages,
} from '@features/sku/utils';

interface Props {
  images: SkuImage[];
  thumbnails?: SkuImage[];
  primaryImage: SkuImage | null;
  maxThumbsDesktop?: number;
}

const SkuImageGallery: FC<Props> = ({
  images,
  thumbnails,
  primaryImage,
  maxThumbsDesktop,
}) => {
  // Number of thumbnails visible in desktop rail before paging
  const VISIBLE_THUMBS = maxThumbsDesktop ?? 5;

  /* ----------------------------------------------------------------------- */
  /* LOCAL STATE                                                             */
  /* ----------------------------------------------------------------------- */
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Thumbnail paging (desktop)
  const [thumbStart, setThumbStart] = useState(0);

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

  /**
   * Re-sync selected image when SKU changes or images are replaced.
   * Does NOT run on user thumbnail clicks.
   */
  useEffect(() => {
    if (!selected || selected.id !== mainImage?.id) {
      setSelected(mainImage ?? primaryImage);
    }
  }, [mainImage, primaryImage]);

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

  const visibleThumbs = useMemo(
    () => thumbnailsToUse.slice(thumbStart, thumbStart + VISIBLE_THUMBS),
    [thumbnailsToUse, thumbStart]
  );

  const canScrollUp = thumbStart > 0;
  const canScrollDown = thumbStart + VISIBLE_THUMBS < thumbnailsToUse.length;

  const scrollUp = () => setThumbStart((v) => Math.max(0, v - VISIBLE_THUMBS));

  const scrollDown = () =>
    setThumbStart((v) =>
      Math.min(
        Math.max(0, thumbnailsToUse.length - VISIBLE_THUMBS),
        v + VISIBLE_THUMBS
      )
    );

  return (
    <Box
      display="flex"
      flexDirection={isMobile ? 'column' : 'row'}
      gap={2}
      width="100%"
    >
      {/* DESKTOP: LEFT THUMBNAIL RAIL */}
      {!isMobile && (
        <Stack alignItems="center" spacing={1}>
          <IconButton size="small" disabled={!canScrollUp} onClick={scrollUp}>
            <KeyboardArrowUpIcon />
          </IconButton>

          <ThumbnailList
            images={visibleThumbs}
            selectedId={displayImage?.id}
            isMobile={false}
            onSelect={handleThumbClick}
          />

          <IconButton
            size="small"
            disabled={!canScrollDown}
            onClick={scrollDown}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </Stack>
      )}

      {/* MAIN IMAGE */}
      <Box flex={1} textAlign="center" sx={{ position: 'relative' }}>
        <Tooltip title="Image Metadata">
          <IconButton
            size="small"
            onClick={openMetadata}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: alpha(
                theme.palette.mode === 'dark'
                  ? theme.palette.backgroundCustom.customDark
                  : theme.palette.background.paper,
                0.85
              ),
              '&:hover': {
                backgroundColor: alpha(theme.palette.background.paper, 1),
              },
            }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <CardMedia
          component="img"
          image={displayUrl}
          alt={displayImage?.altText}
          onClick={() => zoomImage && setZoomOpen(true)}
          sx={{
            maxWidth: '100%',
            maxHeight: isMobile ? 320 : 550,
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

      {/* MOBILE: BOTTOM THUMBNAILS */}
      {isMobile && (
        <Box>
          <CustomTypography variant="caption" color="text.secondary" mb={1}>
            Swipe to view images
          </CustomTypography>

          <ThumbnailList
            images={thumbnailsToUse}
            selectedId={displayImage?.id}
            isMobile
            onSelect={handleThumbClick}
          />
        </Box>
      )}

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
