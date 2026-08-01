"use client";

import { useEffect } from "react";

export function CleanDocumentUrl() {
  useEffect(() => {
    const url = new URL(window.location.href);
    let changed = false;
    const sourceMatch = url.pathname.match(
      /^\/document-source\/[^/]+(\/.*)$/,
    );
    if (sourceMatch) {
      url.pathname = sourceMatch[1] === "/__root__" ? "/" : sourceMatch[1];
      changed = true;
    }
    if (url.searchParams.has("__html")) {
      url.searchParams.delete("__html");
      changed = true;
    }
    if (!changed) {
      return;
    }

    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  return null;
}
