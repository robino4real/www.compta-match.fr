export const formatPrice = (value: number, currency: "EUR" = "EUR") => {
  if (Number.isNaN(value)) return "--";

  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
};
