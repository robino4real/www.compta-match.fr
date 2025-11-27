import { prisma } from "../config/prisma";
import { User } from "@prisma/client";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateOtpCode() {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
}

export async function createAdminTwoFactorCode(userId: string) {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.adminTwoFactorCode.updateMany({
    where: { userId, consumed: false },
    data: { consumed: true },
  });

  const record = await prisma.adminTwoFactorCode.create({
    data: {
      userId,
      code,
      expiresAt,
    },
  });

  return { code, token: record.id, expiresAt };
}

export async function verifyAdminTwoFactorCode(
  token: string,
  code: string
): Promise<
  | { status: "NOT_FOUND" }
  | { status: "EXPIRED" }
  | { status: "INVALID_CODE" }
  | { status: "TOO_MANY_ATTEMPTS" }
  | { status: "VALID"; user: User }
> {
  const record = await prisma.adminTwoFactorCode.findUnique({
    where: { id: token },
    include: { user: true },
  });

  if (!record || !record.user) {
    return { status: "NOT_FOUND" };
  }

  if (record.consumed) {
    return { status: "EXPIRED" };
  }

  const now = new Date();
  if (record.expiresAt < now) {
    await prisma.adminTwoFactorCode.update({
      where: { id: record.id },
      data: { consumed: true },
    });
    return { status: "EXPIRED" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.adminTwoFactorCode.update({
      where: { id: record.id },
      data: { consumed: true },
    });
    return { status: "TOO_MANY_ATTEMPTS" };
  }

  if (record.code !== code) {
    const updated = await prisma.adminTwoFactorCode.update({
      where: { id: record.id },
      data: {
        attempts: { increment: 1 },
        consumed: record.attempts + 1 >= MAX_ATTEMPTS,
      },
    });

    if (updated.attempts >= MAX_ATTEMPTS) {
      return { status: "TOO_MANY_ATTEMPTS" };
    }

    return { status: "INVALID_CODE" };
  }

  await prisma.adminTwoFactorCode.update({
    where: { id: record.id },
    data: { consumed: true },
  });

  return { status: "VALID", user: record.user };
}
