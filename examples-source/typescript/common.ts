import { BrawsrClient, type ForkResult } from "@brawsr/sdk";

type SessionCloser = Pick<BrawsrClient, "closeSession" | "closeSessions">;

export const markerKey = "brawsr-example-marker";

export function configuration(): { brawsr: BrawsrClient; url: string } {
  if (!process.env.BRAWSR_API_KEY)
    throw new Error("BRAWSR_API_KEY is required");
  const baseUrl = process.env.BRAWSR_EXAMPLE_BASE_URL;
  return {
    brawsr: new BrawsrClient(baseUrl ? { baseUrl } : undefined),
    url: process.env.BRAWSR_EXAMPLE_URL ?? "https://example.com",
  };
}

export async function closeSessionTree(
  brawsr: SessionCloser,
  sourceSessionId: string,
  forks: readonly (ForkResult | undefined)[] = [],
): Promise<void> {
  const errors: unknown[] = [];
  for (const forked of forks) {
    if (!forked) continue;
    try {
      const outcomes = await brawsr.closeSessions(forked, { concurrency: 4 });
      errors.push(
        ...outcomes.filter((outcome) => !outcome.ok).map(({ error }) => error),
      );
    } catch (error) {
      errors.push(error);
    }
  }
  try {
    await brawsr.closeSession(sourceSessionId);
  } catch (error) {
    errors.push(error);
  }
  if (errors.length > 0)
    throw new AggregateError(errors, "session cleanup failed");
}
