import { FC } from 'react';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CardMedia from '@mui/material/CardMedia';
import { SkuImage } from '@features/sku/state';
import { formatImageUrl } from '@utils/formatImageUrl';

interface ThumbnailListProps {
  images: SkuImage[];
  selectedId?: string;
  isMobile: boolean;
  onSelect: (img: SkuImage) => void;
}

const THUMB_SIZE = 150;

const ThumbnailList: FC<ThumbnailListProps> = ({
  images,
  selectedId,
  isMobile,
  onSelect,
}) => {
  const theme = useTheme();

  return (
    <Stack
      role="listbox"
      aria-orientation={isMobile ? 'horizontal' : 'vertical'}
      direction={isMobile ? 'row' : 'column'}
      spacing={1}
      sx={{
        maxWidth: isMobile ? '100%' : THUMB_SIZE + 12,
        overflowX: isMobile ? 'auto' : 'hidden',
        overflowY: isMobile ? 'hidden' : 'auto',
      }}
    >
      {images.map((img) => {
        const isSelected = img.id === selectedId;

        return (
          <Box
            key={img.id}
            role="option"
            tabIndex={0}
            aria-selected={isSelected}
            onClick={() => onSelect(img)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(img);
              }
            }}
            sx={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: 2,
              border: isSelected
                ? `2px solid ${theme.palette.primary.main}`
                : `1px solid ${theme.palette.divider}`,
              backgroundColor: isSelected
                ? alpha(theme.palette.primary.main, 0.08)
                : 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'border-color 0.15s, background-color 0.15s',
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
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
                backgroundColor: theme.palette.background.paper,
              }}
            />
          </Box>
        );
      })}
    </Stack>
  );
};

export default ThumbnailList;
