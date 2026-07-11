import type { ReactNode } from "react";

export function PublicPageShell({
  children,
  maxWidth = "max-w-sm",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16 text-ink">
      <div className={`w-full ${maxWidth} rounded-2xl bg-white p-8 ring-1 ring-black/5`}>
        {children}
      </div>
    </div>
  );
}
