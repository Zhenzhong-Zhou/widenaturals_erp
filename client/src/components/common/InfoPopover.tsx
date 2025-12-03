import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import CustomTypography from '@components/common/CustomTypography';

export interface InfoField {
  label: string;
  value: string | number | null | undefined;
}

interface InfoPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  title: string;
  fields: InfoField[];
  onClose: () => void;
}

const InfoPopover = ({
  anchorEl,
  open,
  title,
  fields,
  onClose,
}: InfoPopoverProps) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Box sx={{ p: 2, maxWidth: 320 }}>
        <CustomTypography variant="subtitle2" sx={{ mb: 1 }}>
          {title}
        </CustomTypography>

        {fields.map((field, i) => (
          <CustomTypography key={i} variant="body2" sx={{ mb: 0.5 }}>
            <strong>{field.label}:</strong> {field.value ?? '—'}
          </CustomTypography>
        ))}
      </Box>
    </Popover>
  );
};

export default InfoPopover;
