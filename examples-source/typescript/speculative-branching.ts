import { chromium } from "playwright-core";

import type { ForkResult } from "@brawsr/sdk";

import { closeSessionTree, configuration, markerKey } from "./common.js";

const { brawsr, url } = configuration();
const routes = [
  { name: "primary", url },
  {
    name: "fallback",
    url: process.env.BRAWSR_FALLBACK_URL ?? `${url}?route=fallback`,
  },
] as const;
const session = await brawsr.createSession({
  ttlSeconds: 600,
  displayLabel: "Compare primary and fallback routes",
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
    [markerKey, "prepared-for-route-comparison"] as const,
  );
  const checkpoint = await brawsr.createCheckpoint(session.id, {
    label: "before-route-choice",
  });
  await sourcePage.evaluate(
    ([key, value]: readonly [string, string]) =>
      localStorage.setItem(key, value),
    [markerKey, "source-after-checkpoint"] as const,
  );

  // Each route starts from the same prepared browser state. The source plus
  // these two children fits the default three-session organization quota.
  forked = await brawsr.fork(session.id, checkpoint, { n: routes.length });
  const alternatives = await Promise.all(
    forked.children.map(async (child, index) => {
      const route = routes[index];
      if (!route) throw new Error(`branch ${child.branchIndex} has no route`);
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
      if (inherited !== "prepared-for-route-comparison")
        throw new Error(`branch ${child.branchIndex} lost prepared state`);
      await page.goto(route.url);
      const heading = (await page.locator("h1").first().textContent())?.trim();
      return {
        branch: child.branchIndex,
        route: route.name,
        acceptable: Boolean(heading),
        heading,
      };
    }),
  );

  // Selection is application policy. Here the first route with the expected
  // heading wins; a real workflow can apply its own validation or scoring.
  const selected = alternatives.find((candidate) => candidate.acceptable);
  if (!selected) throw new Error("neither route rendered the expected heading");
  console.log(JSON.stringify({ selected, evaluated: alternatives.length }));
} finally {
  await Promise.allSettled(browsers.map((browser) => browser.close()));
  await closeSessionTree(brawsr, session.id, [forked]);
}
