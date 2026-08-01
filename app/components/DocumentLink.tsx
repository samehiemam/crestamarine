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
  const documentHref =
    href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/#")
      ? `/document-recovery.html?path=${encodeURIComponent(href)}`
      : href;

  return (
    <a href={documentHref} {...props}>
      {children}
    </a>
  );
}
