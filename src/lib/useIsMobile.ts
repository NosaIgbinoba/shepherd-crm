import { useEffect, useState } from "react";

// Matches the md breakpoint (768px) already used for the mobile nav in
// Layout.tsx, so drawers flip bottom/right at the same width the sidebar
// flips collapsed/expanded.
const MOBILE_QUERY = "(max-width: 767px)";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
