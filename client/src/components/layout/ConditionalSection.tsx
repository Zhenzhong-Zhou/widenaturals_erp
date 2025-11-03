import type { FC, PropsWithChildren } from 'react';
import Section from './Section';

interface ConditionalSectionProps {
  title: string;
  condition: boolean;
}

const ConditionalSection: FC<PropsWithChildren<ConditionalSectionProps>> = ({
  title,
  condition,
  children,
}) => {
  if (!condition) return null;

  return <Section title={title}>{children}</Section>;
};

export default ConditionalSection;
