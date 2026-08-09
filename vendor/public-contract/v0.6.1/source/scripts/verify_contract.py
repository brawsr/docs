#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
LOCK_PATH = ROOT / "contract-lock.json"


def fail(message: str) -> None:
    raise SystemExit(message)


def main() -> None:
    lock = json.loads(LOCK_PATH.read_text())
    if lock.get("schema_version") != "brawsr-public-contract-lock-v1":
        fail("unsupported contract lock schema")

    relative = lock.get("openapi_path")
    if relative != "openapi/v1.json":
        fail("contract lock must point to openapi/v1.json")
    contract_path = ROOT / relative
    payload = contract_path.read_bytes()
    digest = hashlib.sha256(payload).hexdigest()
    if digest != lock.get("openapi_sha256"):
        fail(f"OpenAPI digest drift: lock={lock.get('openapi_sha256')} actual={digest}")

    contract = json.loads(payload)
    if contract.get("openapi") != "3.1.0":
        fail("OpenAPI document must remain 3.1.0")
    version = contract.get("info", {}).get("version")
    if version != lock.get("contract_version"):
        fail(f"contract version drift: lock={lock.get('contract_version')} actual={version}")
    if contract.get("servers") != [{"url": "https://api.brawsr.io"}]:
        fail("public contract must use the production api.brawsr.io endpoint")

    required_paths = (
        "/v1/sessions",
        "/v1/sessions/{session_id}",
        "/v1/sessions/{session_id}/activity",
        "/v1/sessions/{session_id}/ancestry",
        "/v1/sessions/{session_id}/checkpoints",
        "/v1/sessions/{session_id}/rewind",
        "/v1/sessions/{session_id}/fork",
        "/v1/sessions/{session_id}/lineage",
        "/v1/operations/{operation_id}",
    )
    paths = contract.get("paths", {})
    missing_paths = [path for path in required_paths if path not in paths]
    if missing_paths:
        fail(f"required public paths missing: {missing_paths}")

    schemas = contract.get("components", {}).get("schemas", {})
    required_schemas = (
        "ActivityPage",
        "CapturePage",
        "ForkRequest",
        "ForkChild",
        "ForkResult",
        "Lineage",
        "Operation",
        "Session",
        "SessionActiveOperation",
        "SessionCollectionReferences",
        "SessionDetail",
        "SessionPage",
        "UpdateSessionRequest",
    )
    missing_schemas = [name for name in required_schemas if name not in schemas]
    if missing_schemas:
        fail(f"required public schemas missing: {missing_schemas}")

    forbidden = (
        "firecracker",
        "materialization",
        "netns",
        "snapshot pack",
        "worker incarnation",
    )
    lowered = payload.lower()
    leaked = [term for term in forbidden if term.encode() in lowered]
    if leaked:
        fail(f"internal implementation vocabulary leaked into public contract: {leaked}")

    print(f"public contract valid: version={version} sha256={digest}")


if __name__ == "__main__":
    main()
