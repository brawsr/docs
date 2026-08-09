# Public API contract

This directory is the source of truth for brawsr's customer-facing wire
contract.

- `openapi/v1.json` is the OpenAPI 3.1 document.
- `contract-lock.json` binds the contract version to the exact OpenAPI digest.
- `scripts/verify_contract.py` validates the document and public boundary.
- `tests/` protects the supported session, checkpoint, rewind, fork, lineage,
  and recovery semantics.

The API implementation and SDK repositories consume released contract
identities from `brawsr/docs`; they do not define a separate public contract.
Every contract change must update the lock, pass `npm run contract:check`, and
be reviewed together with the generated API reference and SDK conformance
changes.
