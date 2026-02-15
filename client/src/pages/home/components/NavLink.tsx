import type { FC } from 'react';
import { Link } from '@mui/material';

interface NavLinkProps {
  href?: string;
  onClick?: () => void;
  children: string;
}

const NavLink: FC<NavLinkProps> = ({ href, children }) => {
  const isActive = window.location.hash === href;

  return (
    <Link
      href={href}
      underline="none"
      sx={{
        fontWeight: 600,
        color: isActive ? '#2f8f46' : '#475569',
        position: 'relative',
        transition: 'color 0.15s ease',

        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -6,
          height: 2,
          borderRadius: 1,
          backgroundColor: isActive ? '#2f8f46' : 'transparent',
        },

        '&:hover': {
          color: '#2f8f46',
        },
      }}
    >
      {children}
    </Link>
  );
};

export default NavLink;
