import { chromium } from "playwright-core";

import type { ForkResult } from "@brawsr/sdk";

import { closeSessionTree, configuration, markerKey } from "./common.js";

const { brawsr, url } = configuration();
const n = Number(process.env.BRAWSR_FORK_N ?? "1");
const session = await brawsr.createSession({
  ttlSeconds: 600,
  displayLabel: `Playwright fork ${n}`,
});
let forked: ForkResult | undefined;
const browsers: Awaited<ReturnType<typeof chromium.connectOverCDP>>[] = [];
try {
  const sourceConnection = brawsr.connectCDP(session);
  const source = await chromium.connectOverCDP(sourceConnection.endpointUrl, {
    headers: sourceConnection.headers,
  });
  browsers.push(source);
  const context = source.contexts()[0] ?? (await source.newContext());
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(url);
  await page.evaluate(
    ([key, value]: readonly [string, string]) =>
      localStorage.setItem(key, value),
    [markerKey, "checkpointed"] as const,
  );
  const checkpoint = await brawsr.createCheckpoint(session.id, {
    label: `playwright-fork-${n}`,
  });
  await page.evaluate(
    ([key, value]: readonly [string, string]) =>
      localStorage.setItem(key, value),
    [markerKey, "source-after-checkpoint"] as const,
  );
  forked = await brawsr.fork(session.id, checkpoint, { n });
  const lineage = await brawsr.getLineage(session.id);
  if (lineage.children.length !== n)
    throw new Error("fork children are missing from session lineage");
  const restored = await Promise.all(
    forked.children.map(async (child) => {
      const connection = brawsr.connectCDP(child);
      const browser = await chromium.connectOverCDP(connection.endpointUrl, {
        headers: connection.headers,
      });
      browsers.push(browser);
      const childPage = browser.contexts()[0]?.pages()[0];
      if (!childPage)
        throw new Error(`child ${child.branchIndex} has no restored page`);
      return childPage.evaluate(
        (key: string) => localStorage.getItem(key),
        markerKey,
      );
    }),
  );
  if (restored.some((value) => value !== "checkpointed"))
    throw new Error("fork lost browser state");
  console.log(
    JSON.stringify({
      framework: "playwright",
      n,
      children: forked.children.length,
    }),
  );
} finally {
  await Promise.allSettled(browsers.map((browser) => browser.close()));
  await closeSessionTree(brawsr, session.id, [forked]);
}
