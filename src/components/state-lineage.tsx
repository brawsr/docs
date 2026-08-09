type StateLineageProps = {
  compact?: boolean;
};

export function StateLineage({ compact = false }: StateLineageProps) {
  return (
    <figure className="lineage-panel">
      <svg
        aria-labelledby="lineage-title lineage-description"
        role="img"
        viewBox="0 0 640 300"
      >
        <title id="lineage-title">Browser state checkpoint, rewind, and fork lineage</title>
        <desc id="lineage-description">
          Browser state returns to a checkpoint and can fork into two branches. A remote server side
          effect remains after the browser rewinds.
        </desc>
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M82 88H270" opacity="0.34" />
          <path d="M270 88H430" opacity="0.34" />
          <path d="M430 88C430 144 346 150 270 150" stroke="var(--lineage-rewind)" />
          <path d="M270 150H386" stroke="var(--lineage-fork)" />
          <path d="M386 150V120H540" stroke="var(--lineage-fork)" />
          <path d="M386 150V184H540" stroke="var(--lineage-fork)" />
          <path d="M82 246H540" opacity="0.34" />
        </g>
        <g fontFamily="var(--font-mono)" fontSize="15" fill="currentColor">
          <text x="24" y="45">browser state</text>
          <text x="24" y="226">remote server</text>
          <text x="92" y="72">checkpoint</text>
          <text x="281" y="72">action</text>
          <text x="312" y="142" fill="var(--lineage-rewind)">rewind</text>
          <text x="550" y="125">A</text>
          <text x="550" y="189">B</text>
          <text x="326" y="234" fill="var(--lineage-warning)">side effect remains</text>
        </g>
        <g>
          <circle cx="82" cy="88" r="8" fill="var(--lineage-checkpoint)" />
          <circle cx="270" cy="88" r="7" fill="currentColor" />
          <circle cx="270" cy="150" r="8" fill="var(--lineage-rewind)" />
          <circle cx="386" cy="150" r="8" fill="var(--lineage-fork)" />
          <circle cx="540" cy="120" r="7" fill="var(--lineage-fork)" />
          <circle cx="540" cy="184" r="7" fill="var(--lineage-fork)" />
          <circle cx="270" cy="246" r="7" fill="var(--lineage-warning)" />
        </g>
      </svg>
      <figcaption className="lineage-caption">
        {compact
          ? 'Rewind restores captured browser state. Remote systems keep effects they already accepted.'
          : 'Checkpoint at an explicit safe point. Rewind restores the browser, while fork creates ordered child sessions from the chosen checkpoint.'}
      </figcaption>
    </figure>
  );
}
