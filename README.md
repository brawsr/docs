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
`npm run content:check` fails on contract, customer-copy, or generated-page
drift.

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
- Do not add an OpenAPI proxy or collect API keys in this static site.
- Do not describe private checkpointing internals in customer-facing content.
- Do not imply that rewind reverses remote-server effects.
- Keep the homepage aligned with the active `brawsr.io` design principles:
  Inter Tight, white canvas, electric-blue state signals, precise hairlines,
  and the `brawsr.` wordmark. Do not invent a standalone mark.
- Review generated API and SDK examples against released consumers before publishing them.
