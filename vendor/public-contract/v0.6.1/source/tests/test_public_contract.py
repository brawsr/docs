from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
MARKDOWN_LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


class PublicContractTest(unittest.TestCase):
    def contract(self) -> dict:
        return json.loads((ROOT / "openapi" / "v1.json").read_text())

    def test_relative_links_resolve(self) -> None:
        for document in (
            ROOT / "README.md",
            ROOT / "API.md",
            ROOT / "LIMITATIONS.md",
            ROOT / "MCP.md",
        ):
            for target in MARKDOWN_LINK.findall(document.read_text()):
                if target.startswith(("http://", "https://", "mailto:", "#")):
                    continue
                relative = target.split("#", 1)[0]
                with self.subTest(document=document.name, target=target):
                    self.assertTrue((document.parent / relative).resolve().exists())

    def test_fork_is_atomic_and_ordered(self) -> None:
        contract = self.contract()
        operation = contract["paths"]["/v1/sessions/{session_id}/fork"]["post"]
        self.assertEqual(operation["responses"]["201"]["content"]["application/json"]["schema"], {"$ref": "#/components/schemas/ForkResult"})
        self.assertEqual(operation["responses"]["202"], {"$ref": "#/components/responses/OperationAccepted"})
        children = contract["components"]["schemas"]["ForkResult"]["properties"]["children"]
        self.assertEqual(children["minItems"], 1)
        self.assertEqual(children["maxItems"], 10)
        self.assertIn("branch_index", contract["components"]["schemas"]["ForkChild"]["required"])

    def test_session_workspace_is_bounded_and_runtime_scoped(self) -> None:
        contract = self.contract()
        paths = contract["paths"]

        sessions = paths["/v1/sessions"]
        self.assertIn("get", sessions)
        self.assertIn("post", sessions)
        parameter_refs = {
            parameter.get("$ref") for parameter in sessions["get"]["parameters"]
        }
        parameter_names = {
            parameter.get("name") for parameter in sessions["get"]["parameters"]
        }
        self.assertIn("#/components/parameters/WorkspaceLimit", parameter_refs)
        self.assertIn("#/components/parameters/WorkspaceCursor", parameter_refs)
        self.assertTrue(
            {"search", "session_id", "created_from", "created_before"}.issubset(
                parameter_names
            )
        )

        workspace_limit = contract["components"]["parameters"]["WorkspaceLimit"]["schema"]
        self.assertEqual(workspace_limit["minimum"], 1)
        self.assertEqual(workspace_limit["maximum"], 100)
        self.assertEqual(workspace_limit["default"], 50)

        update = paths["/v1/sessions/{session_id}"]["patch"]
        self.assertEqual(update["operationId"], "updateSession")
        update_schema = update["requestBody"]["content"]["application/json"]["schema"]
        self.assertEqual(update_schema, {"$ref": "#/components/schemas/UpdateSessionRequest"})

        detail_schema = paths["/v1/sessions/{session_id}"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
        self.assertEqual(detail_schema, {"$ref": "#/components/schemas/SessionDetail"})
        detail = contract["components"]["schemas"]["SessionDetail"]
        self.assertTrue(
            {
                "checkpoint_count",
                "direct_child_count",
                "visible_descendant_count",
                "visible_descendant_count_truncated",
                "collections",
            }.issubset(detail["required"])
        )

    def test_session_cdp_url_is_optional(self) -> None:
        session = self.contract()["components"]["schemas"]["Session"]
        self.assertIn("cdp_url", session["properties"])
        self.assertNotIn("cdp_url", session["required"])
        self.assertIn("attachable", session["required"])
        self.assertIn("closed/expired", session["properties"]["cdp_url"]["description"])

    def test_capture_history_and_rewindable_ancestry_are_distinct(self) -> None:
        paths = self.contract()["paths"]
        captures = paths["/v1/sessions/{session_id}/checkpoints"]["get"]
        ancestry = paths["/v1/sessions/{session_id}/ancestry"]["get"]
        self.assertEqual(captures["operationId"], "listCheckpoints")
        self.assertEqual(ancestry["operationId"], "listSessionAncestry")
        self.assertIn("not a list of valid rewind targets", captures["description"])
        self.assertIn("currently rewindable", ancestry["summary"])
        self.assertEqual(
            captures["responses"]["200"]["content"]["application/json"]["schema"],
            {"$ref": "#/components/schemas/CapturePage"},
        )

    def test_activity_and_lineage_are_customer_ready_and_stay_lazy(self) -> None:
        contract = self.contract()
        paths = contract["paths"]
        activity = paths["/v1/sessions/{session_id}/activity"]["get"]
        lineage = paths["/v1/sessions/{session_id}/lineage"]["get"]
        self.assertEqual(activity["summary"], "List session activity")
        self.assertEqual(
            activity["description"],
            "Returns session events and checkpoint, rewind, and fork outcomes.",
        )
        for forbidden in ("internal retries", "worker messages", "leases", "saga"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, activity["description"].lower())
        self.assertIn("one cursor-paged set of direct children", lineage["description"])
        self.assertLessEqual(
            contract["components"]["schemas"]["Lineage"]["properties"]["children"]["maxItems"],
            100,
        )

        customer_docs = (ROOT / "API.md").read_text().lower()
        for forbidden in (
            "worker incarnation",
            "snapshot pack",
            "netns",
            "firecracker",
            "owning worker",
            "materialization",
        ):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, customer_docs)

    def test_recovery_limitations_remain_explicit(self) -> None:
        limitations = (ROOT / "LIMITATIONS.md").read_text().lower()
        for required in (
            "remote server effects are not rewound",
            "browser-library objects become stale",
            "selenium webdriver does not reconnect transparently",
            "live connections are re-established, not preserved",
        ):
            with self.subTest(required=required):
                self.assertIn(required, limitations)

    def test_public_endpoint_and_copy_are_release_ready(self) -> None:
        contract = self.contract()
        self.assertEqual(contract["servers"], [{"url": "https://api.brawsr.io"}])

        readme = (ROOT / "README.md").read_text()
        self.assertTrue(
            readme.startswith(
                "# brawsr developer documentation\n\nThe public API contract"
            )
        )
        mcp_guide = (ROOT / "MCP.md").read_text()
        self.assertIn("connects to brawsr automatically", " ".join(mcp_guide.split()))
        self.assertNotIn("production endpoint", mcp_guide.lower())
        self.assertNotIn("built in", mcp_guide.lower())
        configuration = re.search(r"```text\n(.*?)```", mcp_guide, re.DOTALL)
        self.assertIsNotNone(configuration)
        self.assertEqual(
            configuration.group(1).strip().splitlines(),
            ["BRAWSR_API_KEY=...", "BRAWSR_MCP_TIMEOUT_MS=30000  # optional"],
        )


if __name__ == "__main__":
    unittest.main()
