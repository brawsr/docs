from __future__ import annotations

import json
import os

from brawsr import BrawsrClient
from playwright.sync_api import sync_playwright

MARKER_KEY = "brawsr-example-marker"


def main() -> None:
    url = os.environ.get("BRAWSR_EXAMPLE_URL", "https://example.com")
    base_url = os.environ.get("BRAWSR_EXAMPLE_BASE_URL")

    client = BrawsrClient(base_url=base_url) if base_url else BrawsrClient()
    with client as brawsr, sync_playwright() as playwright:
        session = brawsr.create_session(
            ttl_seconds=600,
            display_label="Python Playwright rewind",
        )
        rewind_operation_id: str | None = None

        try:
            connection = brawsr.connect_cdp(session)
            browser = playwright.chromium.connect_over_cdp(
                connection.endpoint_url,
                headers=dict(connection.headers),
            )
            context = browser.contexts[0]
            page = context.pages[0] if context.pages else context.new_page()

            # A checkpoint is an application-chosen safe point. Prepare the
            # browser state first, then capture it between actions.
            page.goto(url)
            page.evaluate(
                "([key, value]) => localStorage.setItem(key, value)",
                [MARKER_KEY, "checkpointed"],
            )
            checkpoint = brawsr.create_checkpoint(session.id, label="before-edit")

            # This later state is intentionally discarded by rewind.
            page.evaluate(
                "([key, value]) => localStorage.setItem(key, value)",
                [MARKER_KEY, "edited-after-checkpoint"],
            )

            restored = brawsr.rewind(session.id, checkpoint)
            rewind_operation_id = restored.operation_id

            # Rewind replaces the browser process. Every old Playwright handle
            # is stale, so reconnect and rediscover the page.
            restored_connection = brawsr.connect_cdp(restored)
            restored_browser = playwright.chromium.connect_over_cdp(
                restored_connection.endpoint_url,
                headers=dict(restored_connection.headers),
            )
            restored_page = restored_browser.contexts[0].pages[0]
            value = restored_page.evaluate("key => localStorage.getItem(key)", MARKER_KEY)
            if value != "checkpointed":
                raise RuntimeError("rewind lost browser state")

            print(
                json.dumps(
                    {
                        "framework": "python-playwright",
                        "checkpoint_id": checkpoint.checkpoint_id,
                        "rewound": True,
                        "value": value,
                    }
                )
            )
        finally:
            # The early rewind result is already CDP-usable. Wait before close,
            # which is another lifecycle mutation on the same session.
            try:
                if rewind_operation_id is not None:
                    brawsr.wait_rewind(rewind_operation_id)
            finally:
                brawsr.close_session(session.id)


if __name__ == "__main__":
    main()
