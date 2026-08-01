"use client";

import type {
  AnchorHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";

type DocumentLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

/**
 * Hostinger's shared CDN does not reliably vary React Server Component
 * navigation responses. Use document navigation so every route requests HTML.
 */
export function DocumentLink({ href, children, ...props }: DocumentLinkProps) {
  function navigateAsDocument(event: MouseEvent<HTMLAnchorElement>) {
    props.onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === "_blank" ||
      props.download ||
      !href.startsWith("/") ||
      href.startsWith("//") ||
      href.startsWith("/#")
    ) {
      return;
    }

    const destination = new URL(href, window.location.href);
    destination.searchParams.set("__document", Date.now().toString(36));
    const recovery = new URL("/document-recovery.html", window.location.origin);
    recovery.searchParams.set(
      "path",
      `${destination.pathname}${destination.search}${destination.hash}`,
    );
    recovery.searchParams.set("v", Date.now().toString(36));
    event.preventDefault();
    window.location.assign(recovery);
  }

  return (
    <a href={href} {...props} onClick={navigateAsDocument}>
      {children}
    </a>
  );
}
