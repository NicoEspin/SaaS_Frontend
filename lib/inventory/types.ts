export type BranchInventoryItem = {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  categoryName: string | null;
  stockOnHand: number;
  price: number | null;
};

export type InventoryListResult = {
  items: BranchInventoryItem[];
  nextCursor: string | null;
};

export type AdjustStockDto = {
  productId: string;
  quantity: number;
  notes?: string;
};

export type TransferStockDto = {
  toBranchId: string;
  productId: string;
  quantity: number;
};

export type ProductStockResult = {
  stockOnHand: number;
};
