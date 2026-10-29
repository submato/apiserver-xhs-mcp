import { describe, expect, it, vi } from "vitest";

import {
  ApiServerError,
  createApiClient,
  normalizeClientToken,
} from "../src/client.js";

describe("normalizeClientToken", () => {
  it("accepts Bearer and Token schemes", () => {
    expect(normalizeClientToken("Bearer customer-key")).toBe("customer-key");
    expect(normalizeClientToken("Token customer-key")).toBe("customer-key");
  });

  it("rejects missing or unsupported authorization", () => {
    expect(normalizeClientToken(undefined)).toBeNull();
    expect(normalizeClientToken("Basic abc")).toBeNull();
  });
});

describe("createApiClient", () => {
  it("forwards the customer token in the header and encodes query parameters", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ code: 0, data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createApiClient({
      baseUrl: "https://api.example.com",
      token: "customer-key",
      timeoutMs: 1_000,
      maxResponseChars: 10_000,
      fetchImpl: fetchMock as typeof fetch,
    });

    await client.get("/api/xhs/v2/appsearch", {
      keyword: "露营 攻略",
      page: 1,
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://api.example.com/api/xhs/v2/appsearch?keyword=%E9%9C%B2%E8%90%A5+%E6%94%BB%E7%95%A5&page=1",
    );
    expect(init?.headers).toMatchObject({ Authorization: "Token customer-key" });
  });

  it("turns non-success responses into safe tool errors", async () => {
    const client = createApiClient({
      baseUrl: "https://api.example.com",
      token: "customer-key",
      timeoutMs: 1_000,
      maxResponseChars: 10_000,
      fetchImpl: vi.fn(async () => new Response("insufficient balance", { status: 402 })),
    });

    await expect(
      client.get("/api/xhs/v2/notedetail", { noteId: "123" }),
    ).rejects.toEqual(
      expect.objectContaining<ApiServerError>({
        status: 402,
      }),
    );
  });
});
