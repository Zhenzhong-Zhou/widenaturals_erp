import type { FC } from 'react';
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import CustomTypography from "@components/common/CustomTypography";

export interface ImageMetadataField {
  label: string;
  value: string | number | null | undefined;
}

interface ImageMetadataPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  fields: ImageMetadataField[];
  title?: string;
}

const ImageMetadataPopover: FC<ImageMetadataPopoverProps> = ({
                                                               anchorEl,
                                                               open,
                                                               onClose,
                                                               fields,
                                                               title = "Image Metadata",
                                                             }) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Box sx={{ p: 2, maxWidth: 300 }}>
        <CustomTypography variant="subtitle2" sx={{ mb: 1 }}>
          {title}
        </CustomTypography>
        
        {fields.map((f, index) => (
          <CustomTypography key={index} variant="body2" sx={{ mb: 0.5 }}>
            <strong>{f.label}:</strong> {f.value ?? "—"}
          </CustomTypography>
        ))}
      </Box>
    </Popover>
  );
};

export default ImageMetadataPopover;
