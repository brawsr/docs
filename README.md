# brawsr docs

The public source repository and contract authority for brawsr's developer
documentation.

The site is a static Next.js 16/Fumadocs build with local search, generated OpenAPI operation
pages, per-page Markdown, `llms.txt`, and `llms-full.txt`. It does not require a server runtime and
does not contain an API proxy or credential-bearing playground.

## Source of truth

The versioned public API contract lives in [`contract/`](contract/). Its lock
pins the OpenAPI digest, and its tests protect the public checkpoint, rewind,
fork, session workspace, and recovery boundaries.

Customer guides under `content/docs/guides/` are authored in this repository.
API operation pages are generated from `contract/openapi/v1.json`.
Story pages under `content/docs/examples/` use focused excerpts from the
`brawsr/examples` revision in `examples.lock.json`. Internal snapshots keep
those excerpts aligned with the runnable programs. `npm run content:check`
fails on contract, customer-copy, example, or generated-page drift.

To update the displayed examples after publishing the examples repository:

```bash
npm run examples:sync -- --source ../brawsr-examples
npm run examples:source-check -- --source ../brawsr-examples
```

Commit the updated lock and `examples-source/` snapshots together, then update
any story excerpt that changed. The source check rejects stale excerpts and
compares the local examples checkout with the locked revision.

## Local development

Use Node.js `22.23.2` and npm `11.8.0`.

```bash
npm ci
npm run dev
```

## Verification

```bash
npm test
```

The test gate verifies the public contract, regenerates API reference content,
checks for a clean generated diff, type-checks, lints, exports the static site,
validates representative outputs and all 16 API operations, checks internal
links, and confirms the static search and LLM artifacts.

`next build --webpack` is intentional: the Fumadocs MDX macro uses build-time loaders and Webpack
provides deterministic behavior in the current Next.js 16 toolchain.

## Content rules

- Edit `content/docs/guides/` directly; do not edit
  `content/docs/api-reference/operations/` by hand.
- Edit executable example code in `brawsr/examples` and story text in
  `content/docs/examples/`; do not hand-edit files under `examples-source/`.
- Do not add an OpenAPI proxy or collect API keys in this static site.
- Do not describe private checkpointing internals in customer-facing content.
- Do not imply that rewind reverses remote-server effects.
- Keep the homepage aligned with the active `brawsr.io` design principles:
  Inter Tight, white canvas, electric-blue state signals, precise hairlines,
  and canonical assets from `brawsr/brawsr-assets`. Do not redraw or approximate the
  wordmark or favicon.
- Review generated API and SDK examples against released consumers before publishing them.
