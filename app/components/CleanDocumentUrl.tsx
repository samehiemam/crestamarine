"use client";

import { useEffect } from "react";

export function CleanDocumentUrl() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("__html")) {
      return;
    }
    url.searchParams.delete("__html");

    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  return null;
}
