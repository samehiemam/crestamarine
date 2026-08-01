import type { AnchorHTMLAttributes, ReactNode } from "react";

type DocumentLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

const documentVersion = "server-v1";

function versionedDocumentHref(href: string) {
  if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/#")) {
    return href;
  }

  const hashIndex = href.indexOf("#");
  const path = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}__html=${documentVersion}${hash}`;
}

/**
 * Hostinger's shared CDN does not reliably vary React Server Component
 * navigation responses. Use document navigation so every route requests HTML.
 */
export function DocumentLink({ href, children, ...props }: DocumentLinkProps) {
  return (
    <a href={versionedDocumentHref(href)} {...props}>
      {children}
    </a>
  );
}
