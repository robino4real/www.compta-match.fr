import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { generateInvoicePdf } from "../services/pdfService";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role?: string };
}

export async function downloadInvoice(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Facture introuvable" });
    }

    const isAdmin = request.user?.role === "admin";
    if (!isAdmin && invoice.order.userId !== request.user?.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    let pdfPath = invoice.pdfPath;
    const absolutePath = pdfPath
      ? path.join(__dirname, "../../", pdfPath)
      : undefined;

    if (!pdfPath || !absolutePath || !fs.existsSync(absolutePath)) {
      const regenerated = await generateInvoicePdf(invoice.id);
      pdfPath = regenerated.pdfPath;
    }

    const finalAbsolute = path.join(__dirname, "../../", pdfPath!);
    return res.sendFile(finalAbsolute);
  } catch (error) {
    console.error("Erreur téléchargement facture", error);
    return res.status(500).json({ message: "Impossible de télécharger la facture." });
  }
}

export async function adminListInvoices(req: Request, res: Response) {
  const { email, invoiceNumber, date } = req.query as Record<string, string>;

  const where: any = {};
  if (email) where.billingEmail = { contains: email, mode: "insensitive" };
  if (invoiceNumber) where.invoiceNumber = { contains: invoiceNumber };
  if (date) {
    const day = new Date(date);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    where.issueDate = { gte: day, lt: nextDay };
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        order: true,
      },
      orderBy: { issueDate: "desc" },
    });

    return res.json({ invoices });
  } catch (error) {
    console.error("Erreur liste factures", error);
    return res.status(500).json({ message: "Impossible de lister les factures." });
  }
}

export async function adminGetInvoice(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: { include: { items: true, promoCode: true } },
      },
    });

    if (!invoice) return res.status(404).json({ message: "Facture introuvable" });
    return res.json({ invoice });
  } catch (error) {
    console.error("Erreur détail facture", error);
    return res.status(500).json({ message: "Impossible d'afficher la facture." });
  }
}

export async function adminRegenerateInvoice(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return res.status(404).json({ message: "Facture introuvable" });

    const updated = await generateInvoicePdf(id);
    return res.json({ invoice: updated, message: "Facture régénérée" });
  } catch (error) {
    console.error("Erreur régénération facture", error);
    return res.status(500).json({ message: "Impossible de régénérer la facture." });
  }
}
