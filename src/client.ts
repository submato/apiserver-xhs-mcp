export type QueryValue = string | number | boolean | undefined;

export interface ApiClientOptions {
  baseUrl: string;
  token: string;
  timeoutMs: number;
  maxResponseChars: number;
  fetchImpl?: typeof fetch;
}

export class ApiServerError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiServerError";
  }
}

export function normalizeClientToken(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }

  const match = authorization.match(/^(?:Bearer|Token)\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token || null;
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = new URL(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async get(path: string, query: Record<string, QueryValue>): Promise<unknown> {
      const url = new URL(path, baseUrl);

      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }

      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Token ${options.token}`,
          },
          signal: AbortSignal.timeout(options.timeoutMs),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown network error";
        throw new ApiServerError(`Upstream request failed: ${message}`, 502);
      }

      const body = await response.text();
      if (body.length > options.maxResponseChars) {
        throw new ApiServerError(
          `Upstream response exceeded ${options.maxResponseChars} characters. Use pagination or narrower filters.`,
          502,
        );
      }

      let data: unknown = null;
      if (body) {
        try {
          data = JSON.parse(body);
        } catch {
          data = { raw: body };
        }
      }

      if (!response.ok) {
        const detail = body.slice(0, 1_000);
        throw new ApiServerError(
          `API Server returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
          response.status,
        );
      }

      return data;
    },
  };
}
