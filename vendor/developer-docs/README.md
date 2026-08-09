# Vendored developer-docs release

Normal site builds are offline with respect to the private `brawsr/developer-docs` repository.
The exact `v0.6.0` release assets and extracted source live under `v0.6.0/`, while
`developer-docs.lock.json` pins their source identity and SHA-256 digests.

To update the contract, a maintainer must explicitly download a new private release, verify its
published checksums and bundled contract tests, replace the versioned directory, update the
consumer lock, regenerate guides and OpenAPI pages, then review the committed diff. Do not make
ordinary CI fetch private release assets.
