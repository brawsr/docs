import Link from 'next/link';

type StateLineageProps = {
  compact?: boolean;
};

export function StateLineage({ compact = false }: StateLineageProps) {
  return (
    <figure className={`state-instrument${compact ? ' is-compact' : ''}`}>
      <header className="state-instrument-header">
        <div>
          <span>RECOVERY TRACE</span>
          <strong>sess_41f2</strong>
        </div>
        <span className="state-live"><i aria-hidden="true" /> LIVE BROWSER</span>
      </header>

      <div className="state-instrument-canvas">
        <svg
          aria-labelledby="lineage-title lineage-description"
          role="img"
          viewBox="0 0 920 320"
        >
          <title id="lineage-title">Checkpoint, rewind, and fork recovery trace</title>
          <desc id="lineage-description">
            A browser session reaches checkpoint cp_017, a later action fails, the session rewinds
            to the checkpoint, then forks into three independent sessions.
          </desc>
          <defs>
            <marker id="rewind-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="5" refY="3.5">
              <path d="M0 0L7 3.5L0 7Z" fill="var(--lineage-checkpoint)" />
            </marker>
          </defs>

          <g className="state-grid" aria-hidden="true">
            <path d="M0 80H920M0 160H920M0 240H920" />
            <path d="M115 0V320M275 0V320M435 0V320M595 0V320M755 0V320" />
          </g>

          <g className="state-trace-base" aria-hidden="true">
            <path d="M72 116H432" />
          </g>
          <g className="state-trace-rewind" aria-hidden="true">
            <path d="M432 116C432 220 330 230 258 184" markerEnd="url(#rewind-arrow)" />
          </g>
          <g className="state-trace-fork" aria-hidden="true">
            <path d="M258 184H604" />
            <path d="M604 184V128H812" />
            <path d="M604 184H812" />
            <path d="M604 184V240H812" />
          </g>

          <g className="state-node-labels">
            <text x="72" y="78">SESSION READY</text>
            <text x="258" y="78">CHECKPOINT</text>
            <text x="432" y="78">ACTION FAILED</text>
            <text className="state-rewind-label" x="330" y="266">rewind(&quot;cp_017&quot;)</text>
            <text className="state-fork-label" x="620" y="168">fork(3)</text>
          </g>

          <g aria-hidden="true">
            <circle className="state-node" cx="72" cy="116" r="8" />
            <rect className="state-checkpoint" x="246" y="104" width="24" height="24" rx="4" />
            <circle className="state-failure" cx="432" cy="116" r="9" />
            <circle className="state-restored" cx="258" cy="184" r="10" />
            <circle className="state-fork-node" cx="604" cy="184" r="9" />
          </g>

          <g className="state-value-labels">
            <text x="236" y="98">cp_017</text>
            <text x="824" y="133">sess_a</text>
            <text x="824" y="189">sess_b</text>
            <text x="824" y="245">sess_c</text>
          </g>
          <g className="state-branch-nodes" aria-hidden="true">
            <circle cx="812" cy="128" r="7" />
            <circle cx="812" cy="184" r="7" />
            <circle cx="812" cy="240" r="7" />
          </g>
        </svg>
      </div>

      <ol className="state-mobile-trace" aria-label="Recovery trace steps">
        <li><span>SESSION</span><strong>ready</strong></li>
        <li><span>CHECKPOINT</span><strong>cp_017</strong></li>
        <li className="is-failure"><span>ACTION</span><strong>failed</strong></li>
        <li className="is-active"><span>REWIND</span><strong>cp_017 restored</strong></li>
        <li className="is-branch"><span>FORK</span><strong>sess_a · sess_b · sess_c</strong></li>
      </ol>

      <figcaption className="state-instrument-caption">
        <span>RECOVERY BOUNDARY</span>
        <p>
          {compact
            ? 'The browser returns to cp_017. Effects already accepted by a remote server remain.'
            : 'Checkpoint at an explicit safe point. Rewind restores browser state; fork creates independent live sessions from the selected checkpoint.'}
        </p>
        {compact ? <Link href="/docs/guides/recovery-limitations">Read the boundary ↗</Link> : null}
      </figcaption>
    </figure>
  );
}
