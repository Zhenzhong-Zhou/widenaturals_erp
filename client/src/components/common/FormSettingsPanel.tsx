import type { FC } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

export interface FormSettingItem {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

interface FormSettingsPanelProps {
  title?: string;
  settings: FormSettingItem[];
}

const FormSettingsPanel: FC<FormSettingsPanelProps> = ({ settings }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor:
          theme.palette.mode === 'light'
            ? theme.palette.grey[50]
            : theme.palette.grey[800],
        mb: 3,
        border: '1px solid #EEE',
      }}
    >
      <FormGroup row sx={{ gap: 4 }}>
        {settings.map((item) => (
          <FormControlLabel
            key={item.id}
            control={
              <Switch
                checked={item.checked}
                onChange={(_, c) => item.onToggle(c)}
              />
            }
            label={item.label}
          />
        ))}
      </FormGroup>
    </Box>
  );
};

export default FormSettingsPanel;
