// Single-tenant placeholder — every public (no-login) page needs an orgId
// without an authenticated session to read it from. Revisit if/when a
// second organization signs up (see PROJECT.md).
export const PUBLIC_ORG_ID = "jpd";

// attendance_records.service_name is free text in the database (no
// migration needed to add a service) — this is the one place the UI has
// to know what services exist, to drive the admin form's options, the
// two chart series, and the copy-link buttons. Adding a third service
// needs a small edit here, though never a migration. See PROJECT.md.
export const KNOWN_SERVICES: { value: string; label: string }[] = [
  { value: "first_service", label: "First Service" },
  { value: "youth_service", label: "Youth Service" },
];

export function serviceLabel(value: string): string {
  const known = KNOWN_SERVICES.find((s) => s.value === value);
  if (known) return known.label;
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
