import { memo, type FC } from 'react';
import {
  Tooltip,
  type TypographyProps
} from '@mui/material';
import { CustomTypography } from '@components/index';
import { truncateText } from '@utils/textUtils';

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
                                                 sx,
                                                 ...rest
                                               }) => {
  if (!text) return null;
  
  const truncated = truncateText(text, maxLength, ellipsis);
  const isTruncated = truncated !== text;
  
  return (
    <Tooltip title={isTruncated ? text : ''} placement="top" arrow>
      <CustomTypography
        {...rest}
        noWrap
        component="span"
        className={className}
        sx={[
          {
            display: 'inline-flex',
            alignItems: 'center',
            maxWidth: '100%',
            verticalAlign: 'middle',
            lineHeight: 'inherit',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            cursor: isTruncated ? 'help' : 'default',
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {truncated}
      </CustomTypography>
    </Tooltip>
  );
};

export default memo(TruncatedText);
