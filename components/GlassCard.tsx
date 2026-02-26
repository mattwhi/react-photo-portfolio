import * as React from "react";
import { cn } from "@/lib/cn";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "subtle";
  interactive?: boolean;
};

export function GlassCard({
  className,
  children,
  variant = "default",
  interactive = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass",
        variant === "subtle" && "glass-subtle",
        interactive && "glass-press",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
