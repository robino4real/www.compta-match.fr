import { Request, Response } from "express";
import { NewsletterPreferenceSource } from "@prisma/client";
import { getPreferencesFromToken, updatePreferences, hardUnsubscribe } from "../services/newsletter/preferenceService";
import { computeScoreForSubscriber } from "../services/newsletter/scoringEngine";

const DEFAULT_PREFS = {
  topics: ["products", "promos", "content", "announcements"],
  frequency: "weekly",
  receiveNewsletters: true,
  receiveTransactional: true,
};

export async function getPreferences(req: Request, res: Response) {
  const token = (req.query.token as string) || "";
  const ctx = await getPreferencesFromToken(token);
  if (!ctx) return res.status(400).json({ error: "Lien invalide ou expiré" });
  const prefs = ctx.subscriber.preferencesJson || DEFAULT_PREFS;
  res.json({
    email: ctx.subscriber.email,
    preferences: prefs,
    status: ctx.subscriber.status,
  });
}

export async function savePreferences(req: Request, res: Response) {
  const token = (req.query.token as string) || "";
  const ctx = await getPreferencesFromToken(token);
  if (!ctx) return res.status(400).json({ error: "Lien invalide ou expiré" });
  const prefs = req.body?.preferences || DEFAULT_PREFS;
  const unsubscribe = req.body?.unsubscribe === true || prefs.receiveNewsletters === false;
  const updated = await updatePreferences(ctx.subscriber.id, prefs, NewsletterPreferenceSource.PUBLIC_PAGE, unsubscribe);
  if (updated) {
    await computeScoreForSubscriber(updated.id);
  }
  res.json({ success: true });
}

export async function unsubscribeFromToken(req: Request, res: Response) {
  const token = (req.query.token as string) || "";
  const ctx = await getPreferencesFromToken(token);
  if (!ctx) return res.status(400).json({ error: "Lien invalide ou expiré" });
  await hardUnsubscribe(ctx.subscriber.id, NewsletterPreferenceSource.EMAIL);
  res.json({ success: true });
}
