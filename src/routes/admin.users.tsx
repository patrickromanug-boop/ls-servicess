import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminUsersQueryOptions } from "@/lib/admin";

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Users — LS Services admin" },
      { name: "description", content: "Staff reference directory of registered jobseekers." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Users — LS Services admin" },
      { property: "og:description", content: "Registered user directory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const users = useQuery(adminUsersQueryOptions());
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users.data ?? [];
    return (users.data ?? []).filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(term) ||
        (u.phone ?? "").includes(term) ||
        (u.role ?? "").toLowerCase().includes(term),
    );
  }, [users.data, search]);

  return (
    <AdminShell title="Users" description={`${rows.length} profile(s) shown · read-only`}>
      <input
        className="border-border mb-4 w-72 rounded-lg border bg-white px-3 py-2 text-sm outline-none"
        placeholder="Search name, phone or role"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="border-border overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              {["Name", "Phone", "Role", "Registered"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.isPending && (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                  Loading users…
                </td>
              </tr>
            )}
            {!users.isPending && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                  No users match that search.
                </td>
              </tr>
            )}
            {rows.map((u) => (
              <tr key={u.id} className="border-border border-t">
                <td className="px-4 py-3 font-semibold">{u.full_name ?? "—"}</td>
                <td className="px-4 py-3">{u.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${
                      u.role === "admin"
                        ? "bg-accent-orange/20 text-accent-orange"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {u.role ?? "user"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
