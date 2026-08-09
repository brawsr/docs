# brawsr developer documentation

The public API contract and integration guides for brawsr. The production API
is available at `https://api.brawsr.io` and authenticates server-side clients
with project API keys.

This repository is the source of truth for the customer-facing wire contract.
The API implementation, SDKs, and MCP server are released only against an exact
verified version of [`openapi/v1.json`](openapi/v1.json).

- [API and SDK guide](API.md)
- [MCP server guide](MCP.md)
- [Recovery limitations](LIMITATIONS.md)
- [OpenAPI 3.1 contract](openapi/v1.json)

## Verification

```sh
make verify
```

Verification checks the locked OpenAPI digest, required session-workspace and
fork/operation schemas, forbidden internal implementation vocabulary, and local
documentation links.

## Contract changes

1. Merge a backward-compatible contract and update `contract-lock.json`.
2. Tag an immutable contract candidate.
3. Update the API implementation's contract pin and pass server conformance.
4. Update SDK/MCP pins and pass consumer conformance.
5. Promote only a fully verified API and consumer combination.

Do not document internal worker, storage, snapshot, placement, or publication
mechanics here.
