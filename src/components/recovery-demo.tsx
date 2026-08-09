'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Adapted from brawsr.io's recovery stage. This local copy keeps docs builds independent.
const phases = [
  {
    key: 'live',
    eyebrow: 'LIVE SESSION',
    label: 'Checkout ready',
    detail: 'The authenticated page is live.',
  },
  {
    key: 'saving',
    eyebrow: 'CHECKPOINT',
    label: 'Capturing safe point',
    detail: 'Checkpointing the current browser.',
  },
  {
    key: 'saved',
    eyebrow: 'CHECKPOINT',
    label: 'Safe point created',
    detail: 'cp_72ba is ready.',
  },
  {
    key: 'failed',
    eyebrow: 'ACTION FAILED',
    label: 'Page state diverged',
    detail: 'The known-good checkpoint is still available.',
  },
  {
    key: 'rewinding',
    eyebrow: 'REWIND',
    label: 'Returning to safe point',
    detail: 'Restoring the browser to cp_72ba.',
  },
  {
    key: 'restored',
    eyebrow: 'SESSION RESTORED',
    label: 'Checkout ready again',
    detail: 'Reconnect and continue.',
  },
] as const;

const phaseDurations = [1400, 1900, 1300, 1700, 1900, 1900] as const;

const chapters = [
  { label: 'Save', phase: 2 },
  { label: 'Error', phase: 3 },
  { label: 'Rewind', phase: 4 },
  { label: 'Continue', phase: 5 },
] as const;

export function RecoveryDemo() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const phase = phases[phaseIndex];

  useEffect(() => {
    if (!playing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setTimeout(() => {
      setPhaseIndex((current) => (current + 1) % phases.length);
    }, phaseDurations[phaseIndex]);

    return () => window.clearTimeout(timer);
  }, [phaseIndex, playing]);

  function inspect(nextPhase: number) {
    setPlaying(false);
    setPhaseIndex(nextPhase);
  }

  function replay() {
    setPhaseIndex(0);
    setPlaying(true);
  }

  return (
    <figure className={`docs-recovery-stage phase-${phase.key}`}>
      <aside className="docs-recovery-meta">
        <div>
          <span className="docs-meta-kicker">LIVE STATE / 03</span>
          <strong>{phase.label}</strong>
          <p>{phase.detail}</p>
        </div>

        <ol className="docs-recovery-path" aria-label="Session recovery state">
          <li className="is-complete">
            <span aria-hidden="true">✓</span>
            <div><small>SESSION</small><strong>Browser live</strong></div>
          </li>
          <li className="is-complete">
            <span aria-hidden="true">✓</span>
            <div><small>SAFE POINT</small><strong>cp_72ba</strong></div>
          </li>
          <li className="is-current">
            <span aria-hidden="true">03</span>
            <div><small>NOW</small><strong>{phase.eyebrow.toLowerCase()}</strong></div>
          </li>
        </ol>

        <div className="docs-recovery-session">
          <span>sess_8f13</span>
          <span>CDP connected</span>
        </div>
      </aside>

      <div className="docs-browser-wrap">
        <div className="docs-snapshot-echo docs-snapshot-echo-one" aria-hidden="true" />
        <div className="docs-snapshot-echo docs-snapshot-echo-two" aria-hidden="true" />

        <div className="docs-browser-window">
          <div className="docs-browser-chrome">
            <div className="docs-traffic-lights" aria-hidden="true"><span /><span /><span /></div>
            <div className="docs-address-bar">shop.mono.test / checkout</div>
            <div className="docs-connection"><span /> LIVE</div>
          </div>

          <div className="docs-browser-content" aria-hidden="true">
            <aside className="docs-checkout-summary">
              <div className="docs-merchant-mark">M</div>
              <span className="docs-summary-line is-wide" />
              <span className="docs-summary-line" />
              <div className="docs-order-row">
                <div className="docs-product-block" />
                <div><strong>Field jacket</strong><span>Graphite · M</span></div>
                <b>$148</b>
              </div>
              <div className="docs-price-row"><span>Total</span><strong>$148.00</strong></div>
            </aside>

            <div className="docs-checkout-main">
              <header><div><span>CHECKOUT</span><h2>Delivery</h2></div><span>2 / 3</span></header>
              <div className="docs-field"><span>Contact</span><strong>hello@northstar.dev</strong></div>
              <div className="docs-field-row">
                <div className="docs-field"><span>First name</span><strong>Maya</strong></div>
                <div className="docs-field"><span>Last name</span><strong>Chen</strong></div>
              </div>
              <div className="docs-field"><span>Address</span><strong>27 Mercer Street</strong></div>
              <div className="docs-delivery-option">
                <i /><div><strong>Express delivery</strong><span>Tomorrow, 09:00–12:00</span></div><b>$12</b>
              </div>
              <div className="docs-continue-button">
                {phase.key === 'failed' ? 'Delivery option unavailable' : 'Continue to payment'}
              </div>
            </div>
          </div>

          <div className="docs-mutation-wash" aria-hidden="true" />
          <div className="docs-scan-field" aria-hidden="true"><span /><b>{phase.key === 'rewinding' ? 'RESTORE' : 'CAPTURE'}</b></div>
          <div className="docs-status-pill" role="status" aria-live={playing ? 'off' : 'polite'}>
            <i /><span><small>{phase.eyebrow}</small><strong>{phase.label}</strong></span>
            {(phase.key === 'saved' || phase.key === 'restored') ? <b>{phase.key === 'saved' ? '00:01.84' : '00:00.28'}</b> : null}
          </div>
        </div>

        <div className="docs-motion-controls">
          <div aria-label="Recovery demo chapters" className="docs-chapter-tabs">
            {chapters.map((chapter, index) => (
              <button
                aria-pressed={phaseIndex === chapter.phase}
                className={phaseIndex === chapter.phase ? 'is-active' : ''}
                key={chapter.label}
                onClick={() => inspect(chapter.phase)}
                type="button"
              >
                <span>0{index + 1}</span>{chapter.label}
              </button>
            ))}
          </div>
          <button className="docs-replay-button" onClick={replay} type="button">
            {playing ? 'Replay' : 'Play sequence'} <span aria-hidden="true">↻</span>
          </button>
        </div>
      </div>

      <figcaption className="docs-recovery-boundary">
        <span>RECOVERY BOUNDARY</span>
        <p>Rewind restores the browser. Effects already accepted by a remote server remain.</p>
        <Link href="/docs/guides/recovery-limitations">Read the boundary ↗</Link>
      </figcaption>
    </figure>
  );
}
