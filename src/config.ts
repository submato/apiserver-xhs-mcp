import "dotenv/config";

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function upstreamUrl(): string {
  const value = process.env.APISERVER_BASE_URL;
  if (!value) {
    throw new Error("APISERVER_BASE_URL is required");
  }

  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("APISERVER_BASE_URL must use HTTP or HTTPS");
  }
  if (
    process.env.NODE_ENV === "production" &&
    url.protocol !== "https:" &&
    process.env.ALLOW_INSECURE_UPSTREAM !== "true"
  ) {
    throw new Error(
      "Production upstream must use HTTPS. Set ALLOW_INSECURE_UPSTREAM=true only for a trusted private network.",
    );
  }
  return url.toString();
}

export const config = {
  apiServerBaseUrl: upstreamUrl(),
  host: process.env.HOST || "0.0.0.0",
  port: positiveInteger("PORT", 3000),
  requestTimeoutMs: positiveInteger("REQUEST_TIMEOUT_MS", 30_000),
  maxResponseChars: positiveInteger("MAX_RESPONSE_CHARS", 200_000),
} as const;
