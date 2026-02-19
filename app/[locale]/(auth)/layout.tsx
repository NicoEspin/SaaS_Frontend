import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function AuthLayout({ children }: Props) {
  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_circle_at_10%_0%,hsl(var(--primary)/0.10),transparent_55%),radial-gradient(900px_circle_at_85%_20%,hsl(var(--ring)/0.08),transparent_50%)]"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
