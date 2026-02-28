export type CartStatus = "DRAFT" | string;

export type CartItem = {
  productId: string;
  name: string;
  code: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type Cart = {
  id: string;
  tenantId: string;
  branchId: string;
  customerId: string | null;
  status: CartStatus;

  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;

  items: CartItem[];
};

export type CreateOrGetCurrentCartDto = {
  customerId?: string;
};

export type AddCartItemDto = {
  productId: string;
  quantity: number;
};

export type UpdateCartItemQtyDto = {
  quantity: number;
};

export type CheckoutCartDto = {
  customerId?: string;
};

export type CheckoutInvoice = {
  id: string;
  number: string;
  status: "DRAFT" | string;
  issuedAt: string | null;
  total: string;
};

export type CheckoutCartResponse = {
  cart: Cart;
  invoice: CheckoutInvoice;
};
