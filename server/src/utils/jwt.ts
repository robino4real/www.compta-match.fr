import crypto from "crypto";

export interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
}

const base64UrlEncode = (value: Buffer) =>
  value
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
};

const createSignature = (data: string, secret: string) => {
  return base64UrlEncode(crypto.createHmac("sha256", secret).update(data).digest());
};

export function signJwt(
  userId: string,
  secret: string,
  expiresInSeconds: number
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64UrlEncode(
    Buffer.from(
      JSON.stringify({
        sub: userId,
        iat: now,
        exp: now + expiresInSeconds,
      })
    )
  );

  const data = `${header}.${payload}`;
  const signature = createSignature(data, secret);

  return `${data}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createSignature(data, secret);

  try {
    const validSignature = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!validSignature) {
      return null;
    }

    const payloadBuffer = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadBuffer.toString("utf-8")) as JwtPayload;

    if (!payload?.exp || !payload?.sub) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("[jwt] invalid token", error);
    return null;
  }
}
