export const formatPaidServicePrice = (value: number, currency: string) => {
  if (Number.isNaN(value)) {
    return "--";
  }

  const decimalPartLength = (() => {
    const [, decimalPart = ""] = `${value}`.split(".");
    if (!decimalPart) return 0;
    return Math.max(decimalPart.length, 2);
  })();

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: decimalPartLength,
    maximumFractionDigits: decimalPartLength,
  })
    .format(value)
    .replace("\u00a0", " ")
    .replace(currency === "EUR" ? "€" : currency, "€");
};
