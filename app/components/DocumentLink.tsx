import type { AnchorHTMLAttributes, ReactNode } from "react";

type DocumentLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

/**
 * Hostinger's shared CDN does not reliably vary React Server Component
 * navigation responses. Use document navigation so every route requests HTML.
 */
export function DocumentLink({ href, children, ...props }: DocumentLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
