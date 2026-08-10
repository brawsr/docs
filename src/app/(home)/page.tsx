import Link from 'next/link';
import { RecoveryDemo } from '@/components/recovery-demo';

const paths = [
  {
    label: 'Quickstart',
    title: 'Run a recoverable session',
    description: 'Create, checkpoint, rewind, and reconnect over CDP.',
    href: '/docs/get-started/quickstart',
  },
  {
    label: 'State model',
    title: 'Understand the lineage',
    description: 'Know what checkpoint, rewind, and fork change—and what they do not.',
    href: '/docs/concepts/state-lineage',
  },
  {
    label: 'API reference',
    title: 'Work from the contract',
    description: 'Read every REST operation and the authenticated CDP handoff.',
    href: '/docs/api-reference',
  },
] as const;

export default function HomePage() {
  return (
    <main className="docs-home-shell">
      <section className="docs-hero" aria-labelledby="docs-hero-title">
        <div className="docs-hero-copy">
          <p className="docs-meta-kicker">DEVELOPER DOCUMENTATION / V0.6</p>
          <h1 id="docs-hero-title">
            <span>Your browser, </span>
            <span className="docs-hero-accent">at any point in time.</span>
          </h1>
        </div>
        <div className="docs-hero-intro">
          <p>
            Checkpoint the live session before a risky action. If the workflow breaks, return to
            the state that worked.
          </p>
          <div className="hero-actions">
            <Link
              className="hero-button hero-button-primary"
              data-analytics-event="docs_open_quickstart"
              data-analytics-placement="hero"
              data-analytics-target="quickstart"
              href="/docs/get-started/quickstart"
            >
              Run the quickstart
              <span aria-hidden="true">↗</span>
            </Link>
            <Link
              className="hero-button"
              data-analytics-event="docs_open_api_reference"
              data-analytics-placement="hero"
              data-analytics-target="api_reference"
              href="/docs/api-reference"
            >
              Read the API
            </Link>
          </div>
        </div>
      </section>

      <RecoveryDemo />

      <section className="docs-paths" aria-labelledby="docs-paths-title">
        <header className="docs-paths-header">
          <p className="docs-meta-kicker">DOCUMENTATION MAP</p>
          <h2 id="docs-paths-title">Go straight to the contract you need.</h2>
        </header>
        <nav className="docs-path-list" aria-label="Documentation paths">
          {paths.map((path) => (
            <Link
              className="docs-path"
              data-analytics-event="docs_open_path"
              data-analytics-placement="documentation_map"
              data-analytics-target={path.label.toLowerCase().replaceAll(' ', '_')}
              href={path.href}
              key={path.href}
            >
              <span className="docs-path-label">{path.label}</span>
              <h3>{path.title}</h3>
              <p>{path.description}</p>
              <span className="docs-path-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
