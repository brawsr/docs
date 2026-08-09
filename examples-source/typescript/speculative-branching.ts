import { chromium } from "playwright-core";

import type { ForkResult } from "@brawsr/sdk";

import { closeSessionTree, configuration, markerKey } from "./common.js";

const { brawsr, url } = configuration();
const session = await brawsr.createSession({
  ttlSeconds: 600,
  displayLabel: "Speculative alternatives",
});
let forked: ForkResult | undefined;
const browsers: Awaited<ReturnType<typeof chromium.connectOverCDP>>[] = [];
try {
  const sourceConnection = brawsr.connectCDP(session);
  const source = await chromium.connectOverCDP(sourceConnection.endpointUrl, {
    headers: sourceConnection.headers,
  });
  browsers.push(source);
  const sourceContext = source.contexts()[0] ?? (await source.newContext());
  const sourcePage =
    sourceContext.pages()[0] ?? (await sourceContext.newPage());
  await sourcePage.goto(url);
  await sourcePage.evaluate(
    ([key, value]: readonly [string, string]) =>
      localStorage.setItem(key, value),
    [markerKey, "prepared-for-alternatives"] as const,
  );
  const checkpoint = await brawsr.createCheckpoint(session.id, {
    label: "before-alternatives",
  });
  await sourcePage.evaluate(
    ([key, value]: readonly [string, string]) =>
      localStorage.setItem(key, value),
    [markerKey, "source-after-checkpoint"] as const,
  );

  // The default organization quota allows the source plus two child sessions.
  forked = await brawsr.fork(session.id, checkpoint, { n: 2 });
  const alternatives = await Promise.all(
    forked.children.map(async (child) => {
      const connection = brawsr.connectCDP(child);
      const browser = await chromium.connectOverCDP(connection.endpointUrl, {
        headers: connection.headers,
      });
      browsers.push(browser);
      const page = browser.contexts()[0]?.pages()[0];
      if (!page) throw new Error(`branch ${child.branchIndex} has no page`);
      const inherited = await page.evaluate(
        (key: string) => localStorage.getItem(key),
        markerKey,
      );
      if (inherited !== "prepared-for-alternatives")
        throw new Error(`branch ${child.branchIndex} lost prepared state`);
      await page.goto(`${url}?alternative=${child.branchIndex}`);
      return {
        branch: child.branchIndex,
        sessionId: child.sessionId,
        inherited,
        title: await page.title(),
      };
    }),
  );

  // Selection is application policy. brawsr returns peers and never chooses a winner.
  const selected = alternatives.find((candidate) => candidate.title.length > 0);
  if (!selected)
    throw new Error("application selection found no useful result");
  console.log(JSON.stringify({ selected, evaluated: alternatives.length }));
} finally {
  await Promise.allSettled(browsers.map((browser) => browser.close()));
  await closeSessionTree(brawsr, session.id, [forked]);
}
