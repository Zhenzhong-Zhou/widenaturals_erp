import { memo, type FC } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { truncateText } from '@utils/textUtils';
import CustomTypography from '@components/common/CustomTypography';
import type { TypographyProps } from '@mui/material/Typography';

interface TruncatedTextProps extends TypographyProps {
  text: string | null | undefined;
  maxLength?: number;
  ellipsis?: string;
}

const TruncatedText: FC<TruncatedTextProps> = ({
  text,
  maxLength = 50,
  ellipsis = '…',
  className,
  ...rest
}) => {
  if (!text) return null;

  const truncated = truncateText(text, maxLength, ellipsis);
  const isTruncated = truncated !== text;

  return (
    <Tooltip title={isTruncated ? text : null} placement="top" arrow>
      <CustomTypography
        noWrap
        component="span"
        className={className}
        sx={{
          display: 'inline-block',
          maxWidth: '100%',
          cursor: isTruncated ? 'help' : 'default',
          ...rest.sx,
        }}
        {...rest}
      >
        {truncated}
      </CustomTypography>
    </Tooltip>
  );
};

export default memo(TruncatedText);
