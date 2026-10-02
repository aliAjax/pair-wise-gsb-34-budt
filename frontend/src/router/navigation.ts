import { useEffect } from "react";

/** Minimal state-router navigation helper (the app shell owns the path state). */
export function Navigate({ to }: { to: string }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("navigate", { detail: to }));
  }, [to]);
  return null;
}
