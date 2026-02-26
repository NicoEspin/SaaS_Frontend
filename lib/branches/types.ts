export type Branch = {
  id: string;
  name: string;
};

export type BranchRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type BranchesListQuery = {
  limit?: number;
  cursor?: string;
  q?: string;
};

export type BranchesListResponse = {
  items: BranchRecord[];
  nextCursor: string | null;
};

export type BranchCreateDto = {
  name: string;
};

export type BranchUpdateDto = {
  name?: string;
};
