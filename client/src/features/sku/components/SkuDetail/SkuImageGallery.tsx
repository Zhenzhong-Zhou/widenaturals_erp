import { type FC, type MouseEvent, useState, useMemo, useEffect } from 'react';
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
import type { SkuImageGroup } from '@features/sku/state/skuTypes';
import {
  buildImageMetadataFields,
  flattenImageMetadata,
} from '@features/sku/utils';

interface Props {
  images: SkuImageGroup[];
  maxThumbsDesktop?: number;
}

const SkuImageGallery: FC<Props> = ({ images, maxThumbsDesktop }) => {
  const VISIBLE_THUMBS = maxThumbsDesktop ?? 5;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [thumbStart, setThumbStart] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [metaAnchorEl, setMetaAnchorEl] = useState<null | HTMLElement>(null);
  const [metaOpen, setMetaOpen] = useState(false);

  /* ----------------------------------------------------------------------- */
  /* SELECT PRIMARY GROUP                                                    */
  /* ----------------------------------------------------------------------- */

  const primaryGroup = useMemo(() => {
    return images.find((g) => g.isPrimary) ?? images[0] ?? null;
  }, [images]);

  const [selectedGroup, setSelectedGroup] = useState<SkuImageGroup | null>(
    primaryGroup
  );

  useEffect(() => {
    if (!selectedGroup || selectedGroup.groupId !== primaryGroup?.groupId) {
      setSelectedGroup(primaryGroup);
    }
  }, [primaryGroup]);

  /* ----------------------------------------------------------------------- */
  /* DISPLAY VARIANTS                                                        */
  /* ----------------------------------------------------------------------- */

  const displayVariant = selectedGroup?.variants.main ?? null;

  const thumbnailGroups = images;

  const displayUrl = useMemo(
    () => formatImageUrl(displayVariant?.imageUrl ?? null),
    [displayVariant]
  );

  const zoomVariant =
    selectedGroup?.variants.zoom ?? selectedGroup?.variants.main ?? null;

  const zoomUrl = useMemo(
    () => formatImageUrl(zoomVariant?.imageUrl ?? null),
    [zoomVariant]
  );

  /* ----------------------------------------------------------------------- */
  /* METADATA                                                                */
  /* ----------------------------------------------------------------------- */

  const flatImage = flattenImageMetadata(selectedGroup, 'main');

  const metadataFields = buildImageMetadataFields(flatImage, {
    type: (v) => formatLabel(v),
    uploadedAt: (v) => formatDateTime(v),
  });

  /* ----------------------------------------------------------------------- */
  /* THUMBNAIL PAGING                                                        */
  /* ----------------------------------------------------------------------- */

  const visibleThumbs = useMemo(
    () => thumbnailGroups.slice(thumbStart, thumbStart + VISIBLE_THUMBS),
    [thumbnailGroups, thumbStart]
  );

  const canScrollUp = thumbStart > 0;
  const canScrollDown = thumbStart + VISIBLE_THUMBS < thumbnailGroups.length;

  const scrollUp = () => setThumbStart((v) => Math.max(0, v - VISIBLE_THUMBS));

  const scrollDown = () =>
    setThumbStart((v) =>
      Math.min(
        Math.max(0, thumbnailGroups.length - VISIBLE_THUMBS),
        v + VISIBLE_THUMBS
      )
    );

  /* ----------------------------------------------------------------------- */
  /* HANDLERS                                                                */
  /* ----------------------------------------------------------------------- */

  const handleThumbClick = (group: SkuImageGroup) => {
    setSelectedGroup(group);
  };

  const openMetadata = (event: MouseEvent<HTMLElement>) => {
    setMetaAnchorEl(event.currentTarget);
    setMetaOpen(true);
  };

  const closeMetadata = () => {
    setMetaOpen(false);
    setMetaAnchorEl(null);
  };

  /* ----------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ----------------------------------------------------------------------- */

  return (
    <Box
      display="flex"
      flexDirection={isMobile ? 'column' : 'row'}
      gap={2}
      width="100%"
    >
      {/* DESKTOP THUMBNAILS */}
      {!isMobile && (
        <Stack alignItems="center" spacing={1}>
          <IconButton size="small" disabled={!canScrollUp} onClick={scrollUp}>
            <KeyboardArrowUpIcon />
          </IconButton>

          <ThumbnailList
            images={visibleThumbs}
            selectedGroupId={selectedGroup?.groupId}
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
          alt={displayVariant?.altText}
          onClick={() => zoomVariant && setZoomOpen(true)}
          sx={{
            maxWidth: '100%',
            maxHeight: isMobile ? 320 : 550,
            objectFit: 'contain',
            borderRadius: 2,
            cursor: zoomVariant ? 'zoom-in' : 'default',
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

      {/* MOBILE THUMBNAILS */}
      {isMobile && (
        <Box>
          <CustomTypography variant="caption" color="text.secondary" mb={1}>
            Swipe to view images
          </CustomTypography>

          <ThumbnailList
            images={thumbnailGroups}
            selectedGroupId={selectedGroup?.groupId}
            isMobile
            onSelect={handleThumbClick}
          />
        </Box>
      )}

      <ZoomImageDialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        imageUrl={zoomUrl}
        altText={zoomVariant?.altText}
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
