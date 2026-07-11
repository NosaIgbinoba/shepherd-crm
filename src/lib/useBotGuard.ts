import { useRef, useState } from "react";

// Cheap client-side deterrent for the public no-login forms. NOT the real
// protection (a scripted attacker calling the Supabase REST API directly
// skips the React app, and this, entirely) — that's the DB-level rate
// limit in 0005_security_hardening.sql. This just filters out unscripted
// bots that fill every field and submit instantly.
const MIN_SUBMIT_MS = 2000;

export function useBotGuard() {
  const loadedAt = useRef(Date.now());
  const [honeypot, setHoneypot] = useState("");

  function isLikelyBot(): boolean {
    return honeypot.trim() !== "" || Date.now() - loadedAt.current < MIN_SUBMIT_MS;
  }

  return { honeypot, setHoneypot, isLikelyBot };
}
