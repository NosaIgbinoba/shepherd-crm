import { Sheet, SheetContent } from "./ui/sheet";
import type { Department, JoinRequest, JoinRequestStatus, Member } from "../types";

const statusStyles: Record<JoinRequestStatus, string> = {
  pending: "bg-amber-clay/15 text-amber-clay",
  approved: "bg-forest/10 text-forest",
  rejected: "bg-neutral-100 text-ink/70",
};

export function JoinRequestDrawer({
  request,
  departments,
  members,
  actioning,
  onClose,
  onApprove,
  onReject,
}: {
  request: JoinRequest;
  departments: Department[];
  members: Member[];
  actioning: boolean;
  onClose: () => void;
  onApprove: (request: JoinRequest) => void;
  onReject: (request: JoinRequest) => void;
}) {
  const department = departments.find((d) => d.id === request.departmentId);
  // Display-only lookup for the admin reviewing this request — not the
  // submit-time /join dedupe (still an open, unresolved limitation, see
  // PROJECT.md), which would need to happen before a duplicate row is even
  // created.
  const matchedMember = members.find((m) => m.phone === request.requesterPhone);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 md:max-w-md">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">{request.requesterName}</h2>
          <span
            className={`mr-6 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyles[request.status]}`}
          >
            {request.status}
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <Field label="Phone">{request.requesterPhone}</Field>
          {request.requesterEmail && <Field label="Email">{request.requesterEmail}</Field>}
          <Field label="Date of birth">
            {new Date(request.dob).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Field>
          <Field label="Department requested">{department?.name ?? "Unknown"}</Field>
          <Field label="Submitted">
            {new Date(request.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Field>

          {matchedMember && (
            <div className="rounded-lg bg-amber-clay/10 p-3 text-xs text-ink/70">
              This phone number already belongs to an existing member:{" "}
              <span className="font-medium text-ink">{matchedMember.name}</span>. Approving this
              request creates a separate, new member record.
            </div>
          )}
        </div>

        {request.status === "pending" && (
          <div className="flex gap-2 border-t border-border p-4">
            <button
              disabled={actioning}
              onClick={() => onApprove(request)}
              className="flex-1 rounded-lg bg-forest px-4 py-2 text-sm text-white hover:bg-forest/90 disabled:opacity-60"
            >
              Approve
            </button>
            <button
              disabled={actioning}
              onClick={() => onReject(request)}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-ink/60">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
