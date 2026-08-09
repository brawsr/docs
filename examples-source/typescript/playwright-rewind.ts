import { BrawsrClient } from "@brawsr/sdk";
import { chromium } from "playwright-core";

const markerKey = "brawsr-example-marker";
const url = process.env.BRAWSR_EXAMPLE_URL ?? "https://example.com";
const baseUrl = process.env.BRAWSR_EXAMPLE_BASE_URL;
const brawsr = new BrawsrClient(baseUrl ? { baseUrl } : undefined);
const session = await brawsr.createSession({
  ttlSeconds: 600,
  displayLabel: "Playwright rewind",
});
let rewindOperationId: string | undefined;

try {
  const connection = brawsr.connectCDP(session);
  const browser = await chromium.connectOverCDP(connection.endpointUrl, {
    headers: connection.headers,
  });
  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = context.pages()[0] ?? (await context.newPage());

  // A checkpoint is an application-chosen safe point. Prepare the browser
  // state first, then capture it between actions.
  await page.goto(url);
  await page.evaluate(
    ([key, value]: readonly [string, string]) =>
      localStorage.setItem(key, value),
    [markerKey, "checkpointed"] as const,
  );
  const checkpoint = await brawsr.createCheckpoint(session.id, {
    label: "before-edit",
  });

  // This later state is intentionally discarded by rewind.
  await page.evaluate(
    ([key, value]: readonly [string, string]) =>
      localStorage.setItem(key, value),
    [markerKey, "edited-after-checkpoint"] as const,
  );

  const restored = await brawsr.rewind(session.id, checkpoint);
  rewindOperationId = restored.operationId;

  // Rewind replaces the browser process. Every old Playwright handle is stale,
  // so reconnect from the returned result and rediscover the page.
  const restoredConnection = brawsr.connectCDP(restored);
  const restoredBrowser = await chromium.connectOverCDP(
    restoredConnection.endpointUrl,
    { headers: restoredConnection.headers },
  );
  const restoredPage = restoredBrowser.contexts()[0]?.pages()[0];
  if (!restoredPage) throw new Error("rewind restored no browser page");

  const value = await restoredPage.evaluate(
    (key: string) => localStorage.getItem(key),
    markerKey,
  );
  if (value !== "checkpointed") throw new Error("rewind lost browser state");

  console.log(
    JSON.stringify({
      framework: "playwright",
      checkpointId: checkpoint.checkpointId,
      rewound: true,
      value,
    }),
  );
} finally {
  // A rewind result can be CDP-usable before its operation is terminal. Wait
  // before close, which is another lifecycle mutation on the same session.
  try {
    if (rewindOperationId) await brawsr.waitRewind(rewindOperationId);
  } finally {
    await brawsr.closeSession(session.id);
  }
}
