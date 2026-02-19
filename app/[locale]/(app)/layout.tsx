import type { ReactNode } from "react";

import AppWrapper from "@/components/layout/AppWrapper";

type Props = {
  children: ReactNode;
};

export default function AppLayout({ children }: Props) {
  return (
    <AppWrapper>{children}</AppWrapper>
  );
}
