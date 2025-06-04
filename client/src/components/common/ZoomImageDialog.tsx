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
            width: '90vw',
            height: '90vh',
          },
        },
      }}
    >
      <DialogContent
        dividers
        sx={{
          p: 0,
        }}
      >
        <Box
          sx={{
            width: 'auto',
            height: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'background.default',
          }}
        >
          <TransformWrapper
            initialScale={0.9}
            minScale={0.5}
            maxScale={3}
            centerOnInit
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
          >
            <TransformComponent
              wrapperStyle={{
                width: 'auto',
                height: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              contentStyle={{
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
                  width: 'auto',
                  height: 'auto',
                  display: 'block',
                  userSelect: 'none',
                }}
              />
            </TransformComponent>
          </TransformWrapper>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ZoomImageDialog;
