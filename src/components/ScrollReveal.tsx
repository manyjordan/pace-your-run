import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export const ScrollReveal = ({ children, className }: Props) => {
  return <div className={className}>{children}</div>;
};
