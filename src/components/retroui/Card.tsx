import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import { Text } from "./Text";

interface CardBaseProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const CardRoot = ({ className, ...props }: CardBaseProps) => (
  <div
    className={cn(
      "inline-block border-2 border-border rounded-[var(--radius-md)] shadow-md transition-all hover:shadow-none bg-card text-card-foreground",
      className,
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }: CardBaseProps) => (
  <div
    className={cn("flex flex-col justify-start p-4 gap-2", className)}
    {...props}
  />
);

const CardTitle = ({ className, ...props }: CardBaseProps) => (
  <Text
    as="h3"
    className={cn("mb-1 text-card-foreground", className)}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: CardBaseProps) => (
  <p className={cn("text-muted-foreground text-sm", className)} {...props} />
);

const CardContent = ({ className, ...props }: CardBaseProps) => (
  <div className={cn("p-4", className)} {...props} />
);

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
});
