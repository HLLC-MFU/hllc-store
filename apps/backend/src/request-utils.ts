const DEFAULT_MAX_JSON_BYTES = 3_200_000;

export async function readLimitedJson<T>(
  request: Request,
  maxBytes = DEFAULT_MAX_JSON_BYTES,
) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    throw new Error("request body is too large");
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > maxBytes) {
    throw new Error("request body is too large");
  }

  return JSON.parse(raw || "{}") as T;
}
