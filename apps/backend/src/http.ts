function json(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function ok(data: unknown, init?: ResponseInit): Response {
  return json({ data }, init);
}

export function okWithCookies(data: unknown, cookies: string[]): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(JSON.stringify({ data }), { headers });
}

export function badRequest(error: unknown): Response {
  return json(
    { error: error instanceof Error ? error.message : "bad request" },
    { status: 400 },
  );
}

export function unauthorized(message = "unauthorized"): Response {
  return json({ error: message }, { status: 401 });
}

export function notFound(message = "not found"): Response {
  return json({ error: message }, { status: 404 });
}

export function tooManyRequests(retryAfterSeconds = 60, message = "too many requests"): Response {
  return json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
