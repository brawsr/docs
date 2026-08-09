import { ArrowUpRight } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';

export function ExternalLink({ children, ...props }: ComponentPropsWithoutRef<'a'>) {
  return (
    <a {...props} data-external-link="true">
      {children}
      <ArrowUpRight
        aria-hidden="true"
        className="external-link-marker"
        focusable="false"
        strokeWidth={1.8}
      />
    </a>
  );
}
