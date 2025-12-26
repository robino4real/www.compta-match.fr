"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
router.get(["/", "/health"], async (_req, res) => {
    const status = {
        ok: true,
        database: "unknown",
        stripeKeyPresent: Boolean(env_1.env.stripeSecretKey),
        stripeWebhookConfigured: Boolean(env_1.env.stripeActiveWebhookSecret),
        emailSettings: "unknown",
    };
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        status.database = "ok";
    }
    catch (error) {
        status.ok = false;
        status.database = "error";
        status.databaseError = error?.message;
    }
    try {
        const emailSettings = await prisma_1.prisma.emailSettings.findFirst();
        status.emailSettings = emailSettings ? "ok" : "missing";
    }
    catch (error) {
        status.ok = false;
        status.emailSettings = "error";
        status.emailSettingsError = error?.message;
    }
    res.json(status);
});
exports.default = router;
