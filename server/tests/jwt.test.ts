import assert from "node:assert";
import test from "node:test";
import { signJwt, verifyJwt } from "../src/utils/jwt";

const SECRET = "unit-test-secret";

test("signs and verifies a JWT payload", () => {
  const token = signJwt("user-123", SECRET, 60);
  const payload = verifyJwt(token, SECRET);

  assert.ok(payload, "payload should be defined");
  assert.strictEqual(payload?.sub, "user-123");
});

test("rejects expired tokens", () => {
  const token = signJwt("user-456", SECRET, -10);
  const payload = verifyJwt(token, SECRET);

  assert.strictEqual(payload, null);
});
