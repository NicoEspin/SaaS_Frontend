export type SalesPoint = {
  label: string;
  revenue: number;
  orders: number;
};

export type TopSkuPoint = {
  sku: string;
  units: number;
};

export type StockSlice = {
  name: string;
  value: number;
};
