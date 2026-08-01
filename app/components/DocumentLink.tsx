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

const documentVersion = "hostinger-20260801-v2";

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
  function navigateWithFreshDocument(event: MouseEvent<HTMLAnchorElement>) {
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
    destination.searchParams.set(
      "__html",
      `${documentVersion}-${Date.now().toString(36)}`,
    );
    event.preventDefault();
    window.location.assign(destination);
  }

  return (
    <a
      href={versionedDocumentHref(href)}
      {...props}
      onClick={navigateWithFreshDocument}
    >
      {children}
    </a>
  );
}
