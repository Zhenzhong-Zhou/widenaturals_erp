import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Link } from '@mui/material';

interface NavLinkProps {
  href?: string;
  onClick?: () => void;
  children: string;
}

const NavLink: FC<NavLinkProps> = ({ href, onClick, children }) => {
  const [hash, setHash] = useState(
    typeof window !== 'undefined' ? window.location.hash : ''
  );

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const isActive = hash === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      underline="none"
      sx={{
        fontWeight: 600,
        color: isActive ? 'primary.main' : 'text.secondary',
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
          backgroundColor: isActive ? 'primary.main' : 'transparent',
          transition: 'background-color 0.15s ease',
        },

        '&:hover': {
          color: 'primary.main',
        },
      }}
    >
      {children}
    </Link>
  );
};

export default NavLink;
