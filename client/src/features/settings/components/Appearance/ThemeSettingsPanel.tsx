import type { FC } from 'react';
import {
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from '@mui/material';
import { useThemeMode } from '@hooks/index';
import type { ThemePreference } from '@features/theme/state/themeSlice';

/**
 * ThemeSettingsPanel
 *
 * Appearance → Theme preferences panel.
 *
 * Responsibilities:
 * - Allow user to choose theme preference
 *
 * Explicitly NOT responsible for:
 * - Dialog open/close
 * - Layout chrome (title, actions)
 * - Persistence mechanics
 */
const ThemeSettingsPanel: FC = () => {
  const { preference, actions } = useThemeMode();

  const handleChange = (value: ThemePreference) => {
    actions.setPreference(value);
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Theme
      </Typography>

      <RadioGroup
        value={preference}
        onChange={(e) => handleChange(e.target.value as ThemePreference)}
      >
        <FormControlLabel
          value="system"
          control={<Radio />}
          label="Follow system"
        />

        <FormControlLabel
          value="time"
          control={<Radio />}
          label="Day / Night (based on location)"
        />
      </RadioGroup>
    </Box>
  );
};

export default ThemeSettingsPanel;
