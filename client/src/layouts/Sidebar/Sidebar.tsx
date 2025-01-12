import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useThemeContext } from '../../context/ThemeContext'; // Access dark mode from context
import Box from '@mui/material/Box';
import { sidebarStyles } from './sidebarStyles';

const Sidebar: FC = () => {
  const { darkMode } = useThemeContext(); // Access dark mode from context
  
  return (
    <Box sx={sidebarStyles(darkMode)} className="sidebar"> {/* Apply global and dynamic styles */}
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/inventory">Inventory</Link></li>
        <li><Link to="/orders">Orders</Link></li>
        <li><Link to="/reports">Reports</Link></li>
        <li><Link to="/settings">Settings</Link></li>
      </ul>
    </Box>
  );
};

export default Sidebar;
