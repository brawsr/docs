import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="brand-lockup">
          <span className="brand-wordmark">brawsr<span aria-hidden="true">.</span></span>
          <span className="brand-section">{appName.replace('brawsr ', '')}</span>
          <span className="version-pill">v0.6</span>
        </span>
      ),
    },
  };
}
