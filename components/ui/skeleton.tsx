import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function Skeleton({ className }: Props) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md border border-border bg-muted/20",
        className
      )}
    />
  );
}
