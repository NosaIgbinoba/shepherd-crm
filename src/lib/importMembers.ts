import Papa from "papaparse";
import { readSheet } from "read-excel-file/browser";
import type { Department, Member, MemberTag } from "../types";

export type ImportField = "name" | "phone" | "email" | "dob" | "tags" | "department" | "joinedAt";

export const IMPORT_FIELDS: { field: ImportField; label: string; required: boolean }[] = [
  { field: "name", label: "Name", required: true },
  { field: "phone", label: "Phone", required: false },
  { field: "email", label: "Email", required: false },
  { field: "dob", label: "Date of birth", required: false },
  { field: "tags", label: "Tags", required: false },
  { field: "department", label: "Department", required: false },
  { field: "joinedAt", label: "Joined date", required: false },
];

// Lowercased, checked as exact match first, then substring, against each
// spreadsheet header — covers the header wording a church admin's own
// export is likely to use without requiring an exact template.
const FIELD_ALIASES: Record<ImportField, string[]> = {
  name: ["name", "full name", "member name", "requester name"],
  phone: ["phone", "phone number", "mobile", "mobile number", "whatsapp", "whatsapp number"],
  email: ["email", "email address"],
  dob: ["dob", "date of birth", "birthday", "birth date"],
  tags: ["tags", "tag", "type", "member type"],
  department: ["department", "dept", "ministry"],
  joinedAt: ["joined", "joined date", "date joined", "join date", "joined at"],
};

const VALID_TAGS: MemberTag[] = ["newcomer", "worker", "leader"];

export interface ParsedSpreadsheet {
  headers: string[];
  rows: unknown[][];
}

export type FieldMapping = Record<ImportField, number | null>;

export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";

  const rawRows: unknown[][] = isCsv
    ? await new Promise((resolve, reject) => {
        Papa.parse(file, {
          skipEmptyLines: true,
          complete: (results) => resolve(results.data as unknown[][]),
          error: reject,
        });
      })
    : await readSheet(file);

  if (rawRows.length === 0) return { headers: [], rows: [] };

  const headers = rawRows[0].map((h) => String(h ?? "").trim());
  const rows = rawRows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));

  return { headers, rows };
}

export function guessFieldMapping(headers: string[]): FieldMapping {
  const mapping = {} as FieldMapping;
  const normalized = headers.map((h) => h.toLowerCase().trim());

  for (const { field } of IMPORT_FIELDS) {
    const aliases = FIELD_ALIASES[field];
    let matchIndex = normalized.findIndex((h) => aliases.includes(h));
    if (matchIndex === -1) {
      matchIndex = normalized.findIndex((h) => aliases.some((alias) => h.includes(alias)));
    }
    mapping[field] = matchIndex === -1 ? null : matchIndex;
  }

  return mapping;
}

function cellText(row: unknown[], columnIndex: number | null): string {
  if (columnIndex === null) return "";
  const value = row[columnIndex];
  return value === undefined || value === null ? "" : String(value).trim();
}

// Excel date cells arrive as JS Date objects (read-excel-file's default
// behavior for date-formatted cells); CSV/text cells are plain strings.
// Handles ISO and DD/MM/YYYY explicitly rather than trusting `new Date()`
// on an ambiguous string — this church is Irish (DD/MM/YYYY), and native
// Date parsing assumes US MM/DD/YYYY for slash-separated dates.
function parseDateCell(row: unknown[], columnIndex: number | null): string | null {
  if (columnIndex === null) return null;
  const value = row[columnIndex];
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value ?? "").trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function parseTagsCell(row: unknown[], columnIndex: number | null): MemberTag[] {
  const text = cellText(row, columnIndex);
  if (!text) return [];
  return text
    .split(/[,;/]/)
    .map((t) => t.trim().toLowerCase())
    .filter((t): t is MemberTag => VALID_TAGS.includes(t as MemberTag));
}

export interface ImportRowResult {
  rowNumber: number; // 1-based, matches spreadsheet row (header = row 1)
  name: string;
  member: Omit<Member, "id" | "orgId"> | null;
  matchedDepartment: Department | null;
  unmatchedDepartmentText: string | null;
  duplicateOf: Member | null;
  error: string | null;
}

export function buildImportRows(
  parsed: ParsedSpreadsheet,
  mapping: FieldMapping,
  existingMembers: Member[],
  existingDepartments: Department[]
): ImportRowResult[] {
  const existingPhones = new Map(
    existingMembers.filter((m) => m.phone.trim() !== "").map((m) => [m.phone.trim(), m])
  );

  return parsed.rows.map((row, index) => {
    const rowNumber = index + 2; // +1 for header row, +1 for 1-based
    const name = cellText(row, mapping.name);
    const phone = cellText(row, mapping.phone);
    const departmentText = cellText(row, mapping.department);

    if (!name) {
      return {
        rowNumber,
        name: "",
        member: null,
        matchedDepartment: null,
        unmatchedDepartmentText: null,
        duplicateOf: null,
        error: "Missing name",
      };
    }

    const matchedDepartment = departmentText
      ? (existingDepartments.find(
          (d) => d.name.toLowerCase() === departmentText.toLowerCase()
        ) ?? null)
      : null;

    const member: Omit<Member, "id" | "orgId"> = {
      name,
      phone,
      email: cellText(row, mapping.email),
      dob: parseDateCell(row, mapping.dob),
      tags: parseTagsCell(row, mapping.tags),
      departmentIds: matchedDepartment ? [matchedDepartment.id] : [],
      joinedAt: parseDateCell(row, mapping.joinedAt) ?? new Date().toISOString().slice(0, 10),
    };

    return {
      rowNumber,
      name,
      member,
      matchedDepartment,
      unmatchedDepartmentText: departmentText && !matchedDepartment ? departmentText : null,
      duplicateOf: phone ? (existingPhones.get(phone) ?? null) : null,
      error: null,
    };
  });
}
