import type { AnchorHTMLAttributes, ReactNode } from "react";

type DocumentLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

function recoveryHref(href: string) {
  if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/#")) {
    return href;
  }

  return `/document-recovery.html?path=${encodeURIComponent(href)}&v=hostinger-20260801-v5`;
}

/**
 * Hostinger's shared CDN does not reliably vary React Server Component
 * navigation responses. Use a static handoff to force a fresh HTML document.
 */
export function DocumentLink({ href, children, ...props }: DocumentLinkProps) {
  return (
    <a href={recoveryHref(href)} {...props}>
      {children}
    </a>
  );
}
