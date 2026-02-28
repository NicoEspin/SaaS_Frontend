export type Cursor = string;

export type CustomerType = "RETAIL" | "WHOLESALE";
export type TaxIdType = "CUIT" | "CUIL" | "DNI" | "PASSPORT" | "FOREIGN";
export type VatCondition =
  | "REGISTERED"
  | "MONOTAX"
  | "EXEMPT"
  | "FINAL_CONSUMER"
  | "FOREIGN";

export type Customer = {
  id: string;
  code: string | null;
  type: CustomerType;
  taxId: string | null;
  taxIdType: TaxIdType | null;
  vatCondition: VatCondition | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomersListResponse = {
  items: Customer[];
  nextCursor: Cursor | null;
};

export type CustomersListQuery = {
  limit?: number;
  cursor?: Cursor;
  isActive?: boolean;
  q?: string;
  name?: string;
  code?: string;
  taxId?: string;
  email?: string;
  phone?: string;
};

export type CustomerCreateDto = {
  code?: string;
  type?: CustomerType;
  taxId?: string;
  taxIdType?: TaxIdType;
  vatCondition?: VatCondition;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
};

export type CustomerUpdateDto = {
  code?: string | null;
  type?: CustomerType;
  taxId?: string | null;
  taxIdType?: TaxIdType | null;
  vatCondition?: VatCondition | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
};
