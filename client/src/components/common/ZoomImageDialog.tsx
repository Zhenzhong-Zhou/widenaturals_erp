import type { FC } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Box from '@mui/material/Box';

interface ZoomImageDialogProps {
  open: boolean;
  imageUrl: string;
  altText?: string;
  onClose: () => void;
}

const ZoomImageDialog: FC<ZoomImageDialogProps> = ({
  open,
  imageUrl,
  altText = 'Zoomed image',
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: '80vh', // square-ish dialog
            height: '80vh',
            maxWidth: '100vw',
            maxHeight: '100vw',
            borderRadius: 3,
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogContent
        dividers
        sx={{
          p: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <TransformWrapper
          initialScale={0.6} // smaller initial zoom = more comfortable view
          minScale={0.5}
          maxScale={3}
          centerOnInit
          wheel={{ step: 0.1 }}
        >
          <TransformComponent>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                p: 3, // padding so image isn't touching edges
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img
                src={imageUrl}
                alt={altText}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain', // ensures tall bottle fits well
                  userSelect: 'none',
                  display: 'block',
                }}
              />
            </Box>
          </TransformComponent>
        </TransformWrapper>
      </DialogContent>
    </Dialog>
  );
};

export default ZoomImageDialog;
