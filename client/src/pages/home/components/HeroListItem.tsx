import type { FC, PropsWithChildren } from 'react';
import { CustomTypography } from '@components/index';

export type HeroListItemProps = PropsWithChildren<{}>;

const HeroListItem: FC<HeroListItemProps> = ({ children }) => {
  return (
    <CustomTypography
      component="li"
      variant="body2"
      sx={{
        color: 'text.secondary',
        mb: 0.5,
      }}
    >
      {children}
    </CustomTypography>
  );
};

export default HeroListItem;
