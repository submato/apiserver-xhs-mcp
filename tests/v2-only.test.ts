import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const toolsSource = readFileSync(new URL("../src/tools.ts", import.meta.url), "utf8");

describe("V2-only public surface", () => {
  it("routes every paid tool call through /api/xhs/v2", () => {
    const routes = [...toolsSource.matchAll(/api\.get\("([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(routes).toHaveLength(8);
    expect(routes.every((route) => route?.startsWith("/api/xhs/v2/"))).toBe(true);
  });

  it("marks every public tool name as V2", () => {
    const toolNames = [
      ...toolsSource.matchAll(/server\.registerTool\(\s*"([^"]+)"/g),
    ].map((match) => match[1]);

    expect(toolNames).toHaveLength(8);
    expect(toolNames.every((name) => name?.startsWith("xhs_v2_"))).toBe(true);
  });
});
