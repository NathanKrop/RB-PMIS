import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

type BreadcrumbProps = React.HTMLAttributes<HTMLElement> & {
  compact?: boolean;
};

type BreadcrumbItemProps = {
  href?: string;
  current?: boolean;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLLIElement>;

export function Breadcrumb({
  children,
  compact,
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <nav role="navigation" aria-label="Breadcrumb" {...props}>
      <ol
        className={cn(
          "flex flex-wrap items-center gap-0.5 text-[10px] text-muted-foreground/80",
          compact && "gap-0.5 text-[10px] sm:gap-1 sm:text-[11px]",
          className
        )}
      >
        {children}
      </ol>
    </nav>
  );
}

export function BreadcrumbItem({
  href,
  current,
  children,
  className,
  ...props
}: BreadcrumbItemProps) {
  return (
    <li className={cn("inline-flex min-w-0 items-center gap-0.5 sm:gap-1", className)} {...props}>
      {href ? (
        <Link
          href={href}
          className="max-w-full whitespace-normal break-words font-medium text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
        >
          {children}
        </Link>
      ) : (
        <span
          aria-current={current ? "page" : undefined}
          className={cn(
            current ? "text-muted-foreground/80 font-normal rounded-full bg-muted/10 px-2 py-0.5" : undefined,
            "max-w-full whitespace-normal break-words"
          )}
        >
          {children}
        </span>
      )}
      {!current && (
        <>
          <svg
            className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground/60"
            viewBox="0 0 8 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="img"
            focusable="false"
          >
            <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sr-only">Separator</span>
        </>
      )}
    </li>
  );
}
