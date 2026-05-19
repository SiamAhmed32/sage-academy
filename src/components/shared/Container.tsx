import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto box-border w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}
