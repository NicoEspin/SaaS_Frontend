"use client";

import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { employeesApi } from "@/lib/employees/api";
import type {
  EmployeeCreateRole,
  EmployeeRecord,
  EmployeeUpdateDto,
  MembershipRole,
} from "@/lib/employees/types";
import { MEMBERSHIP_ROLES } from "@/lib/employees/types";
import { useEmployeeMutations } from "@/lib/employees/hooks/use-employee-mutations";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { isValidEmail, isValidPassword } from "@/lib/validators";
import { useAuthStore } from "@/stores/auth-store";

type Mode = "create" | "edit";

const UNSET_SELECT_VALUE = "__unset__";

type FieldErrors = Record<string, string>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  employeeId: string | null;
  onSaved: () => void;
};

const CREATE_ROLE_VALUES: EmployeeCreateRole[] = ["ADMIN", "MANAGER", "CASHIER"];
const EDIT_ROLE_VALUES: MembershipRole[] = ["OWNER", "ADMIN", "MANAGER", "CASHIER"];

function isMembershipRole(value: string): value is MembershipRole {
  return (MEMBERSHIP_ROLES as readonly string[]).includes(value);
}

export function EmployeeForm({ open, onOpenChange, mode, employeeId, onSaved }: Props) {
  const t = useTranslations("Employees");
  const tc = useTranslations("Common");
  const { submitting, createEmployee, updateEmployee } = useEmployeeMutations();

  const session = useAuthStore((s) => s.session);
  const currentSessionRole = session?.membership.role ?? null;
  const currentRole: MembershipRole | null =
    currentSessionRole && isMembershipRole(currentSessionRole) ? currentSessionRole : null;

  const branches = session?.branches ?? [];
  const defaultBranchId = session?.activeBranch?.id ?? branches[0]?.id ?? UNSET_SELECT_VALUE;

  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [loadedEmployee, setLoadedEmployee] = useState<EmployeeRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);

  const initial = useMemo(() => {
    const e = loadedEmployee;
    if (mode === "edit" && e) {
      return {
        fullName: e.user.fullName,
        email: e.user.email,
        password: "",
        role: e.membership.role as MembershipRole,
        branchId: e.activeBranch?.id ?? UNSET_SELECT_VALUE,
      };
    }

    return {
      fullName: "",
      email: "",
      password: "",
      role: "CASHIER" as EmployeeCreateRole,
      branchId: defaultBranchId,
    };
  }, [defaultBranchId, loadedEmployee, mode]);

  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState(initial.password);
  const [role, setRole] = useState<string>(initial.role);
  const [branchId, setBranchId] = useState<string>(initial.branchId);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const prevOpenRef = useRef(false);

  const isEditingOwner = loadedEmployee?.membership.role === "OWNER";
  const ownerLocked = Boolean(isEditingOwner && currentRole !== "OWNER");

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (!open || wasOpen) return;

    setFormError(null);
    setErrors({});

    if (mode === "create") {
      setLoadedEmployee(null);
      setLoadError(null);
      setEmployeeLoading(false);

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("CASHIER");
      setBranchId(defaultBranchId);
    }
  }, [defaultBranchId, mode, open]);

  useEffect(() => {
    if (!open || mode !== "edit") return;
    if (!employeeId) {
      setLoadError(tc("errors.generic"));
      return;
    }

    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    setEmployeeLoading(true);
    setLoadError(null);
    setLoadedEmployee(null);

    void (async () => {
      try {
        const e = await employeesApi.get(employeeId, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setLoadedEmployee(e);

        setFullName(e.user.fullName);
        setEmail(e.user.email);
        setPassword("");
        setRole(e.membership.role);
        setBranchId(e.activeBranch?.id ?? UNSET_SELECT_VALUE);
      } catch (err) {
        if (controller.signal.aborted) return;
        setLoadError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      } finally {
        if (!controller.signal.aborted) setEmployeeLoading(false);
      }
    })();

    return () => controller.abort();
  }, [employeeId, mode, open, tc]);

  function validate() {
    const next: FieldErrors = {};
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password;

    if (!cleanName) next.fullName = t("validation.fullNameRequired");
    else if (cleanName.length > 200) next.fullName = t("validation.fullNameMax", { max: 200 });

    if (mode === "create") {
      if (!cleanEmail) next.email = t("validation.emailRequired");
      else if (cleanEmail.length > 320) next.email = t("validation.emailMax", { max: 320 });
      else if (!isValidEmail(cleanEmail)) next.email = t("validation.invalidEmail");

      if (!cleanPassword.trim()) next.password = t("validation.passwordRequired");
      else if (cleanPassword.trim().length > 200) next.password = t("validation.passwordMax", { max: 200 });
      else if (!isValidPassword(cleanPassword)) next.password = t("validation.passwordMin", { min: 8 });

      if (!CREATE_ROLE_VALUES.includes(role as EmployeeCreateRole)) next.role = t("validation.roleRequired");

      if (branchId === UNSET_SELECT_VALUE) next.branchId = t("validation.branchRequired");
    } else {
      if (!isMembershipRole(role)) next.role = t("validation.roleRequired");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    if (ownerLocked) {
      const msg = t("errors.ownerLocked");
      setFormError(msg);
      toast.error(msg);
      return;
    }

    const cleanName = fullName.trim();

    try {
      if (mode === "edit") {
        if (!employeeId) throw new Error("Missing employeeId");
        const base = loadedEmployee;
        if (!base) throw new Error("Missing employee data");

        const dto: EmployeeUpdateDto = {};

        if (cleanName !== base.user.fullName) dto.fullName = cleanName;

        const nextRole = role as MembershipRole;
        if (nextRole !== base.membership.role) dto.role = nextRole;

        const baseBranchId = base.activeBranch?.id ?? UNSET_SELECT_VALUE;
        if (branchId !== UNSET_SELECT_VALUE && branchId !== baseBranchId) dto.branchId = branchId;

        if (Object.keys(dto).length === 0) {
          setFormError(t("validation.noChanges"));
          return;
        }

        await updateEmployee(employeeId, dto);
        toast.success(t("success.updated"));
      } else {
        const cleanEmail = email.trim();
        const cleanPassword = password;

        await createEmployee({
          fullName: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          role: role as EmployeeCreateRole,
          branchId,
        });
        toast.success(t("success.created"));
      }

      onOpenChange(false);
      onSaved();
    } catch (err) {
      const msg = getAxiosErrorMessage(err) ?? tc("errors.generic");

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 409) {
          const text = t("errors.emailConflict");
          setFormError(text);
          toast.error(text);
          return;
        }

        if (status === 403) {
          const text = msg || t("errors.forbidden");
          setFormError(text);
          toast.error(text);
          return;
        }
      }

      setFormError(msg);
      toast.error(msg);
    }
  }

  const title = mode === "edit" ? t("form.editTitle") : t("form.createTitle");
  const subtitle = mode === "edit" ? t("form.editSubtitle") : t("form.createSubtitle");

  const roleOptions = mode === "edit" ? EDIT_ROLE_VALUES : CREATE_ROLE_VALUES;
  const ownerOptionDisabled = mode !== "edit" || currentRole !== "OWNER";

  const disableForm = Boolean(submitting || employeeLoading || loadError || (mode === "edit" && !loadedEmployee));
  const branchDisabled = branches.length === 0 || disableForm || ownerLocked;
  const roleDisabled = disableForm || ownerLocked;
  const nameDisabled = disableForm || ownerLocked;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        {loadError ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {ownerLocked ? (
          <Alert className="border-border bg-muted/30">
            <AlertDescription>{t("errors.ownerLocked")}</AlertDescription>
          </Alert>
        ) : null}

        {formError ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="employee_fullName">{t("fields.fullName")}</Label>
              {employeeLoading && mode === "edit" ? (
                <Skeleton className="mt-2 h-9 w-full" />
              ) : (
                <>
                  <Input
                    id="employee_fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("fields.fullNamePlaceholder")}
                    aria-invalid={Boolean(errors.fullName)}
                    disabled={nameDisabled}
                  />
                  {errors.fullName ? (
                    <p className="mt-1 text-sm text-destructive">{errors.fullName}</p>
                  ) : null}
                </>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="employee_email">{t("fields.email")}</Label>
              {employeeLoading && mode === "edit" ? (
                <Skeleton className="mt-2 h-9 w-full" />
              ) : (
                <>
                  <Input
                    id="employee_email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("fields.emailPlaceholder")}
                    inputMode="email"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.email)}
                    disabled={mode === "edit" || disableForm}
                  />
                  {mode === "edit" ? (
                    <p className="mt-1 text-xs text-muted-foreground">{t("form.emailReadOnly")}</p>
                  ) : null}
                  {errors.email ? (
                    <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                  ) : null}
                </>
              )}
            </div>

            {mode === "create" ? (
              <div className="md:col-span-2">
                <Label htmlFor="employee_password">{t("fields.password")}</Label>
                <Input
                  id="employee_password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("fields.passwordPlaceholder")}
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  disabled={disableForm}
                />
                <p className="mt-1 text-xs text-muted-foreground">{t("form.passwordHint", { min: 8 })}</p>
                {errors.password ? (
                  <p className="mt-1 text-sm text-destructive">{errors.password}</p>
                ) : null}
              </div>
            ) : null}

            <div className="md:col-span-1">
              <Label htmlFor="employee_role">{t("fields.role")}</Label>
              {employeeLoading && mode === "edit" ? (
                <Skeleton className="mt-2 h-9 w-full" />
              ) : (
                <>
                  <Select value={role} onValueChange={setRole} disabled={roleDisabled}>
                    <SelectTrigger id="employee_role" className="w-full">
                      <SelectValue placeholder={tc("labels.select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => (
                        <SelectItem
                          key={r}
                          value={r}
                          disabled={r === "OWNER" && ownerOptionDisabled}
                        >
                          {t(`roles.${r}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mode === "create" ? (
                    <p className="mt-1 text-xs text-muted-foreground">{t("form.ownerNotAvailable")}</p>
                  ) : null}
                  {errors.role ? (
                    <p className="mt-1 text-sm text-destructive">{errors.role}</p>
                  ) : null}
                </>
              )}
            </div>

            <div className="md:col-span-1">
              <Label htmlFor="employee_branch">{t("fields.branch")}</Label>
              {employeeLoading && mode === "edit" ? (
                <Skeleton className="mt-2 h-9 w-full" />
              ) : (
                <>
                  <Select value={branchId} onValueChange={setBranchId} disabled={branchDisabled}>
                    <SelectTrigger id="employee_branch" className="w-full">
                      <SelectValue placeholder={tc("labels.select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {mode === "edit" && !loadedEmployee?.activeBranch ? (
                        <SelectItem value={UNSET_SELECT_VALUE}>
                          {t("fields.branchUnassigned")}
                        </SelectItem>
                      ) : null}
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {branches.length === 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">{t("validation.noBranches")}</p>
                  ) : null}
                  {errors.branchId ? (
                    <p className="mt-1 text-sm text-destructive">{errors.branchId}</p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {tc("actions.cancel")}
            </Button>
            <Button type="submit" disabled={submitting || ownerLocked || (mode === "create" && branches.length === 0)}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? tc("actions.loading") : mode === "edit" ? tc("actions.save") : tc("actions.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
