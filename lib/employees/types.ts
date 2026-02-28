export const MEMBERSHIP_ROLES = ["OWNER", "ADMIN", "MANAGER", "CASHIER"] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export type EmployeeUser = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

export type EmployeeMembership = {
  id: string;
  role: MembershipRole;
  createdAt: string;
};

export type EmployeeActiveBranch = {
  id: string;
  name: string;
} | null;

export type EmployeeRecord = {
  membership: EmployeeMembership;
  user: EmployeeUser;
  activeBranch: EmployeeActiveBranch;
};

export type EmployeesListQuery = {
  limit?: number;
  cursor?: string;
  q?: string;
  role?: MembershipRole;
  branchId?: string;
};

export type EmployeesListResponse = {
  items: EmployeeRecord[];
  nextCursor: string | null;
};

export type EmployeeCreateRole = Exclude<MembershipRole, "OWNER">;

export type EmployeeCreateDto = {
  fullName: string;
  email: string;
  password: string;
  role: EmployeeCreateRole;
  branchId: string;
};

export type EmployeeUpdateDto = {
  fullName?: string;
  role?: MembershipRole;
  branchId?: string;
};
