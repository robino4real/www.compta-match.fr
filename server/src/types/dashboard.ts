export type DashboardRange = "all" | "year" | "month" | "week" | "day";

export type RevenuePoint = {
  label: string;
  date: string;
  revenue: number;
  ordersCount: number;
};

export type DashboardSalesStats = {
  totalRevenue: number;
  totalStripeFees: number;
  netResult: number;
  ordersCount: number;
  timeline: RevenuePoint[];
};

export type DashboardCustomerStats = {
  totalRegisteredUsers: number;
  newUsersInRange: number;
  customersWithOrdersAllTime: number;
  customersWithOrdersInRange: number;
  customersWithSubscriptionAllTime: number;
};

export type DashboardProductSales = {
  productId: string;
  name: string;
  type: "downloadable" | "subscription";
  salesCountInRange: number;
  salesCountAllTime: number;
  subscribersInRange?: number;
  subscribersAllTime?: number;
};

export type DashboardProductInteraction = {
  productId: string;
  name: string;
  viewsInRange: number;
  addToCartInRange: number;
};

export type DashboardStatsResponse = {
  range: DashboardRange;
  generatedAt: string;
  sales: DashboardSalesStats;
  customers: DashboardCustomerStats;
  products: {
    sales: DashboardProductSales[];
    interactions: DashboardProductInteraction[];
  };
};
