import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Upload, XCircle } from "lucide-react";
import { Sheet, SheetContent } from "./ui/sheet";
import { db, departmentsDb } from "../lib/db";
import type { Department, Member } from "../types";
import { useAuth } from "../lib/auth/AuthContext";
import {
  buildImportRows,
  guessFieldMapping,
  IMPORT_FIELDS,
  parseSpreadsheetFile,
  type FieldMapping,
  type ImportField,
  type ImportRowResult,
  type ParsedSpreadsheet,
} from "../lib/importMembers";

const PREVIEW_LIMIT = 10;

export function ImportMembersDrawer({
  members,
  departments,
  onClose,
  onImported,
}: {
  members: Member[];
  departments: Department[];
  onClose: () => void;
  onImported: () => void;
}) {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [mapping, setMapping] = useState<FieldMapping | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    importedCount: number;
    skipped: { rowNumber: number; reason: string }[];
  } | null>(null);

  const rows = useMemo<ImportRowResult[]>(() => {
    if (!parsed || !mapping) return [];
    return buildImportRows(parsed, mapping, members, departments);
  }, [parsed, mapping, members, departments]);

  const validCount = rows.filter((r) => r.member !== null).length;
  const errorCount = rows.length - validCount;
  const duplicateCount = rows.filter((r) => r.duplicateOf !== null).length;
  const unmatchedDeptCount = rows.filter((r) => r.unmatchedDepartmentText !== null).length;

  async function handleFile(file: File) {
    setParseError(null);
    setParsed(null);
    setMapping(null);
    try {
      const result = await parseSpreadsheetFile(file);
      if (result.headers.length === 0 || result.rows.length === 0) {
        setParseError("No data found in that file. Check it has a header row and at least one member row.");
        return;
      }
      setParsed(result);
      setMapping(guessFieldMapping(result.headers));
    } catch {
      setParseError("Couldn't read that file. Make sure it's a .csv, .xlsx, or .xls file.");
    }
  }

  function updateMapping(field: ImportField, columnIndex: number | null) {
    setMapping((prev) => (prev ? { ...prev, [field]: columnIndex } : prev));
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.member !== null).map((r) => r.member!);
    const skipped = rows
      .filter((r) => r.error !== null)
      .map((r) => ({ rowNumber: r.rowNumber, reason: r.error! }));

    setImporting(true);
    try {
      const created = await db.createMembers(orgId, validRows);

      // Keep department.memberIds in sync, same as JoinRequestsPage's
      // single-approval flow — grouped by department id read back off the
      // created rows themselves, so this doesn't depend on insert order.
      const newMemberIdsByDept = new Map<string, string[]>();
      for (const m of created) {
        for (const deptId of m.departmentIds) {
          newMemberIdsByDept.set(deptId, [...(newMemberIdsByDept.get(deptId) ?? []), m.id]);
        }
      }
      for (const [deptId, newMemberIds] of newMemberIdsByDept) {
        const dept = departments.find((d) => d.id === deptId);
        if (!dept) continue;
        await departmentsDb.updateDepartment(orgId, deptId, {
          name: dept.name,
          leaderId: dept.leaderId,
          memberIds: [...dept.memberIds, ...newMemberIds],
        });
      }

      setResult({ importedCount: created.length, skipped });
      onImported();
    } finally {
      setImporting(false);
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 md:max-w-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Import members</h2>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-forest/10 p-3 text-sm text-forest">
                <CheckCircle2 className="size-4 shrink-0" />
                Imported {result.importedCount} member{result.importedCount === 1 ? "" : "s"}.
              </div>
              {result.skipped.length > 0 && (
                <div className="rounded-lg bg-amber-clay/10 p-3 text-xs text-ink/70">
                  <div className="mb-1 font-medium text-ink">
                    Skipped {result.skipped.length} row{result.skipped.length === 1 ? "" : "s"}:
                  </div>
                  {result.skipped.map((s) => (
                    <div key={s.rowNumber}>
                      Row {s.rowNumber}: {s.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center hover:bg-neutral-50">
                  <Upload className="size-5 text-ink/40" />
                  <span className="text-sm font-medium">
                    {parsed ? "Choose a different file" : "Choose a file to import"}
                  </span>
                  <span className="text-xs text-ink/40">.csv, .xlsx, or .xls</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </label>
                {parseError && <p className="mt-2 text-sm text-destructive">{parseError}</p>}
              </div>

              {parsed && mapping && (
                <>
                  <div>
                    <div className="mb-2 text-xs font-medium text-ink/60">
                      Match spreadsheet columns to member fields
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {IMPORT_FIELDS.map(({ field, label, required }) => (
                        <label key={field} className="block">
                          <span className="mb-1 block text-xs text-ink/60">
                            {label}
                            {required && " *"}
                          </span>
                          <select
                            value={mapping[field] ?? ""}
                            onChange={(e) =>
                              updateMapping(field, e.target.value === "" ? null : Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
                          >
                            <option value="">Not mapped</option>
                            {parsed.headers.map((header, index) => (
                              <option key={index} value={index}>
                                {header || `Column ${index + 1}`}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-ink/60">
                        Preview ({rows.length} row{rows.length === 1 ? "" : "s"} found)
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-lg ring-1 ring-black/5">
                      <table className="w-full text-xs">
                        <thead className="bg-neutral-50 text-left">
                          <tr>
                            <th className="px-3 py-2"></th>
                            <th className="px-3 py-2 font-medium">Name</th>
                            <th className="px-3 py-2 font-medium">Phone</th>
                            <th className="px-3 py-2 font-medium">Department</th>
                            <th className="px-3 py-2 font-medium">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, PREVIEW_LIMIT).map((row) => (
                            <tr key={row.rowNumber} className="border-t border-border">
                              <td className="px-3 py-2">
                                {row.error ? (
                                  <XCircle className="size-4 text-destructive" />
                                ) : row.duplicateOf || row.unmatchedDepartmentText ? (
                                  <AlertTriangle className="size-4 text-amber-clay" />
                                ) : (
                                  <CheckCircle2 className="size-4 text-forest" />
                                )}
                              </td>
                              <td className="px-3 py-2">{row.name || "—"}</td>
                              <td className="px-3 py-2 text-ink/70">{row.member?.phone || "—"}</td>
                              <td className="px-3 py-2 text-ink/70">
                                {row.matchedDepartment?.name ?? (row.unmatchedDepartmentText || "—")}
                              </td>
                              <td className="px-3 py-2 text-ink/70">
                                {row.error ??
                                  (row.duplicateOf
                                    ? `Phone matches existing member: ${row.duplicateOf.name}`
                                    : row.unmatchedDepartmentText
                                      ? "Department not found — left unassigned"
                                      : "")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {rows.length > PREVIEW_LIMIT && (
                      <p className="mt-1 text-xs text-ink/40">
                        +{rows.length - PREVIEW_LIMIT} more row{rows.length - PREVIEW_LIMIT === 1 ? "" : "s"} not shown.
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-ink/60">
                    {validCount} ready to import
                    {errorCount > 0 && `, ${errorCount} will be skipped (missing name)`}
                    {duplicateCount > 0 && `, ${duplicateCount} match an existing member's phone`}
                    {unmatchedDeptCount > 0 && `, ${unmatchedDeptCount} with an unrecognized department`}
                    .
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border p-4">
          {result ? (
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-forest px-4 py-2 text-sm text-white hover:bg-forest/90"
            >
              Done
            </button>
          ) : (
            <button
              disabled={validCount === 0 || importing}
              onClick={handleImport}
              className="w-full rounded-lg bg-forest px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {importing ? "Importing…" : `Import ${validCount} member${validCount === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
