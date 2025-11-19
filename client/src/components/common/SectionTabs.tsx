import { type FC, type ReactNode, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";

export interface TabItem {
  label: string;
  content: ReactNode;
}

interface SectionTabsProps {
  tabs: TabItem[];
  defaultIndex?: number;
}

const SectionTabs: FC<SectionTabsProps> = ({ tabs, defaultIndex = 0 }) => {
  const [value, setValue] = useState(defaultIndex);
  
  return (
    <Box sx={{ width: "100%", mt: 4 }}>
      <Tabs
        value={value}
        onChange={(_, newValue) => setValue(newValue)}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 2 }}
      >
        {tabs.map((t, i) => (
          <Tab key={i} label={t.label} />
        ))}
      </Tabs>
      
      <Box sx={{ pt: 2 }}>
        {tabs[value] ? tabs[value]!.content : null}
      </Box>
    </Box>
  );
};

export default SectionTabs;
