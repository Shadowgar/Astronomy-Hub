import { ReactNode } from 'react';

export interface SectionHeaderProps {
  title: any;
  subtitle?: any;
  action?: ReactNode;
}

declare const SectionHeader: (props: SectionHeaderProps) => JSX.Element;

export default SectionHeader;
