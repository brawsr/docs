# Verified public contract input

Site builds use a deterministic local input. The exact `v0.6.1` release assets and extracted
source live under `v0.6.1/`, while
`developer-docs.lock.json` pins their source identity and SHA-256 digests.

To update the contract, a maintainer must explicitly download a new private release, verify its
published checksums and bundled contract tests, replace the versioned directory, update the
consumer lock, regenerate guides and OpenAPI pages, then review the committed diff.
