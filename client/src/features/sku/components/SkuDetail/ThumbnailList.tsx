import type { FC } from 'react';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CardMedia from '@mui/material/CardMedia';
import type { SkuImageGroup } from '@features/sku/state';
import { formatImageUrl } from '@utils/formatImageUrl';

interface ThumbnailListProps {
  images: SkuImageGroup[];
  selectedGroupId?: string;
  isMobile: boolean;
  onSelect: (group: SkuImageGroup) => void;
}

const THUMB_SIZE = 150;

const ThumbnailList: FC<ThumbnailListProps> = ({
                                                 images,
                                                 selectedGroupId,
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
      {images.map((group) => {
        // Select correct variant for thumbnail display
        const variant =
          group.variants.thumbnail ??
          group.variants.main ??
          group.variants.zoom;
        
        if (!variant) return null;
        
        const isSelected = group.groupId === selectedGroupId;
        
        return (
          <Box
            key={group.groupId}
            role="option"
            tabIndex={0}
            aria-selected={isSelected}
            onClick={() => onSelect(group)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(group);
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
              image={formatImageUrl(variant.imageUrl)}
              alt={variant.altText ?? ''}
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
