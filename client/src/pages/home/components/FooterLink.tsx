import type { FC, PropsWithChildren } from 'react';
import { Link } from '@mui/material';

export interface FooterLinkProps extends PropsWithChildren {
  href: string;
  external?: boolean;
}

const FooterLink: FC<FooterLinkProps> = ({
  href,
  external = false,
  children,
}) => {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      underline="none"
      sx={{
        fontSize: 14,
        fontWeight: 500,
        color: 'text.primary',
        transition: 'color 0.15s ease, text-decoration-color 0.15s ease',
        '&:hover': {
          textDecoration: 'underline',
          color: 'primary.main',
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
          borderRadius: 0.5,
        },
      }}
    >
      {children}
    </Link>
  );
};

export default FooterLink;
