# brawsr docs

The private source repository for brawsr's public developer documentation.

The site is a static Next.js 16/Fumadocs build with local search, generated OpenAPI operation
pages, per-page Markdown, `llms.txt`, and `llms-full.txt`. It does not require a server runtime and
does not contain an API proxy or credential-bearing playground.

## Source of truth

Guides and the OpenAPI reference are bound to the private
[`brawsr/developer-docs`](https://github.com/brawsr/developer-docs) `v0.6.0` release. Release assets
and extracted source are vendored under `vendor/developer-docs/v0.6.0/`; the consumer lock pins:

- release tag and URL;
- source commit and tree;
- verified CI run;
- release asset digests;
- the complete extracted source inventory; and
- the OpenAPI digest.

Ordinary builds do not fetch private GitHub content. `npm run content:check` fails on any lock,
manifest, asset, source-file, contract, or generated-page drift.

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

The test gate verifies the vendored release, regenerates release-bound content, checks for a clean
generated diff, type-checks, lints, exports the static site, validates representative outputs and
all 16 API operations, checks internal links, and confirms the static search and LLM artifacts.

`next build --webpack` is intentional: the Fumadocs MDX macro uses build-time loaders and Webpack
provides deterministic behavior in the current Next.js 16 toolchain.

## Content rules

- Do not edit `content/docs/guides/` or `content/docs/api-reference/operations/` by hand.
- Do not add an OpenAPI proxy or collect API keys in this static site.
- Do not describe private checkpointing internals in customer-facing content.
- Do not imply that rewind reverses remote-server effects.
- Review generated API and SDK examples against released consumers before publishing them.
