import Link from 'next/link';
import { StateLineage } from '@/components/state-lineage';

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="docs-hero">
        <div className="docs-hero-copy">
          <div className="eyebrow">Browser state you can reason about</div>
          <h1>Recover, retry, and branch with intent.</h1>
          <p>
            brawsr gives browser automation an explicit state model: checkpoint at a safe point,
            rewind the browser when an action fails, or fork parallel sessions from one known state.
          </p>
          <div className="hero-actions">
            <Link className="hero-button hero-button-primary" href="/docs/get-started/quickstart">
              Start building
            </Link>
            <Link className="hero-button" href="/docs/api-reference">
              Explore the API
            </Link>
          </div>
        </div>
        <StateLineage compact />
      </section>
      <section className="docs-home-grid" aria-label="Documentation paths">
        <Link className="docs-home-card" href="/docs/get-started/quickstart">
          <span className="docs-home-card-number">01 / Connect</span>
          <h2>Run your first recoverable session</h2>
          <p>Create a session, capture an explicit safe point, rewind, then reconnect over CDP.</p>
        </Link>
        <Link className="docs-home-card" href="/docs/concepts/state-lineage">
          <span className="docs-home-card-number">02 / Understand</span>
          <h2>Model state lineage correctly</h2>
          <p>Learn what checkpoint, rewind, and fork change—and what they deliberately do not.</p>
        </Link>
        <Link className="docs-home-card" href="/docs/guides/recovery-limitations">
          <span className="docs-home-card-number">03 / Design safely</span>
          <h2>Plan around recovery boundaries</h2>
          <p>Remote side effects remain. Use safe points, idempotency, and reconciliation deliberately.</p>
        </Link>
      </section>
    </main>
  );
}
