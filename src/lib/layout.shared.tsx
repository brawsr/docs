import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">b/</span>
          <span>{appName}</span>
          <span className="version-pill">v0.6</span>
        </span>
      ),
    },
  };
}
