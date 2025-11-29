import assert from "node:assert";
import test from "node:test";
import { ensureAdminAccount, ADMIN_BACKOFFICE_EMAIL } from "../src/services/adminAccountService";
import { hashPassword } from "../src/utils/password";
import { env } from "../src/config/env";

const baseUser = {
  id: "user-1",
  email: ADMIN_BACKOFFICE_EMAIL,
  passwordHash: hashPassword("password123"),
  role: "admin",
  isEmailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test("returns existing admin without recreating", async () => {
  const mockClient: any = {
    user: {
      findUnique: () => Promise.resolve(baseUser),
    },
  };

  const result = await ensureAdminAccount(mockClient);
  assert.strictEqual(result, baseUser);
});

test("creates admin when password is provided", async () => {
  const createdUser = { ...baseUser, id: "created" };
  const originalPassword = env.adminBackofficePassword;
  (env as any).adminBackofficePassword = "StrongPass123";
  const mockClient: any = {
    user: {
      findUnique: () => Promise.resolve(null),
      create: ({ data }: any) => {
        assert.strictEqual(data.email, ADMIN_BACKOFFICE_EMAIL);
        assert.strictEqual(data.role, "admin");
        assert.ok(data.passwordHash.length > 10);
        return Promise.resolve(createdUser);
      },
    },
  };

  const result = await ensureAdminAccount(mockClient);
  assert.strictEqual(result, createdUser);
  (env as any).adminBackofficePassword = originalPassword;
});

test("returns null when password is missing", async () => {
  const mockClient: any = {
    user: {
      findUnique: () => Promise.resolve(null),
    },
  };

  const originalPassword = env.adminBackofficePassword;
  (env as any).adminBackofficePassword = "";

  const result = await ensureAdminAccount(mockClient);
  assert.strictEqual(result, null);

  (env as any).adminBackofficePassword = originalPassword;
});
