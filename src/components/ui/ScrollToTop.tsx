"use client";

import { useEffect } from "react";

export default function ScrollToTop() {
  useEffect(() => {
    // Skip if URL has a hash (e.g. #projects) — honor anchor links
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, []);

  return null;
}
