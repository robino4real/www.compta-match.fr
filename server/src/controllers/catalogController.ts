import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getOrCreateSeoSettings } from "../services/seoSettingsService";
import { getOrCreateCompanySettings } from "../services/companySettingsService";
import { getOrCreateEmailSettings } from "../services/emailSettingsService";
import {
  getBreadcrumbStructuredData,
  getGlobalStructuredData,
  getProductStructuredData,
} from "../utils/structuredData";

export async function listCatalogDownloads(req: Request, res: Response) {
  try {
    const includeInactive = req.query.includeInactive === "true";

    const products = await prisma.downloadableProduct.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const [seoSettings, companySettings, emailSettings] = await Promise.all([
      getOrCreateSeoSettings(),
      getOrCreateCompanySettings(),
      getOrCreateEmailSettings(),
    ]);

    const baseStructuredData = [
      ...getGlobalStructuredData({ seoSettings, companySettings, emailSettings }),
    ];
    const productData = products.flatMap((product) =>
      getProductStructuredData({
        seoSettings,
        product,
        canonicalPath: `/telechargements/${product.slug}`,
        companySettings,
      })
    );
    const breadcrumb = getBreadcrumbStructuredData({
      seoSettings,
      items: [
        { name: "Accueil", path: "/" },
        { name: "Téléchargements", path: "/telechargements" },
      ],
    });

    const structuredData = [...baseStructuredData, ...productData];
    if (breadcrumb) {
      structuredData.push(breadcrumb);
    }

    return res.json({ products, structuredData });
  } catch (error) {
    console.error("Erreur lors du chargement des téléchargements catalog", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les produits téléchargeables." });
  }
}
