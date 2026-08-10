import { ArrowUpRight } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';

export function ExternalLink({ children, ...props }: ComponentPropsWithoutRef<'a'>) {
  const analyticsTarget =
    typeof props.href === 'string'
      ? (() => {
          try {
            return new URL(props.href).hostname;
          } catch {
            return 'external';
          }
        })()
      : 'external';

  return (
    <a
      {...props}
      data-analytics-event="docs_open_external_link"
      data-analytics-placement="documentation"
      data-analytics-target={analyticsTarget}
      data-external-link="true"
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
      <ArrowUpRight
        aria-hidden="true"
        className="external-link-marker"
        focusable="false"
        strokeWidth={1.8}
      />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
