import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[520px] w-full" />}>
      <LoginClient />
    </Suspense>
  );
}
