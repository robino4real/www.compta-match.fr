import crypto from "crypto";

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(PASSWORD_SALT_BYTES).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, PASSWORD_KEY_LENGTH)
    .toString("hex");

  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, storedKey] = storedHash.split(":");
  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = crypto
    .scryptSync(password, salt, PASSWORD_KEY_LENGTH)
    .toString("hex");

  const storedBuffer = Buffer.from(storedKey, "hex");
  const derivedBuffer = Buffer.from(derivedKey, "hex");

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
}
