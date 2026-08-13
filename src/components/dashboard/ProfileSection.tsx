import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, ChevronDown, KeyRound, Save, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { deleteAccount, profileQueryOptions, updateProfile } from "@/lib/account";

// Fetch all available categories
async function fetchAllCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// Fetch all available locations
async function fetchAllLocations() {
  const { data, error } = await supabase
    .from("locations")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export function ProfileSection({ user }: { user: User }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const profileQuery = useQuery(profileQueryOptions(user.id));

  // Fetch full lists of options from the database
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchAllCategories,
    staleTime: 5 * 60 * 1000,
  });
  const { data: locationsData = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchAllLocations,
    staleTime: 5 * 60 * 1000,
  });

  const isGoogleAccount = user.app_metadata?.provider === "google";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    setFullName(p.full_name ?? (user.user_metadata?.["full_name"] as string) ?? "");
    setPhone(p.phone ?? "");
    setCategories(p.preferred_categories ?? []);
    setLocations(p.preferred_locations ?? []);
  }, [profileQuery.data, user]);

  const categoryOptions = useMemo(
    () => categoriesData.map((c: any) => c.name),
    [categoriesData]
  );
  const locationOptions = useMemo(
    () => locationsData.map((l: any) => l.name),
    [locationsData]
  );

  const save = useMutation({
    mutationFn: () =>
      updateProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
        preferred_categories: categories,
        preferred_locations: locations,
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      void qc.invalidateQueries({ queryKey: ["profile", user.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPassword("");
      toast.success("Password changed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAccount = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => navigate({ to: "/account-deleted", replace: true }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Card title="Your details">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Full name" value={fullName} onChange={setFullName} />
          <TextField label="Phone number" value={phone} onChange={setPhone} />
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          Your preferences below decide which job links we send to your WhatsApp. Pick the
          categories and locations you actually want to hear about.
        </p>

        <MultiSelectDropdown
          label="Preferred categories"
          options={categoryOptions}
          selected={categories}
          onToggle={(v) =>
            setCategories((prev) =>
              prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
            )
          }
        />
        <MultiSelectDropdown
          label="Preferred locations"
          options={locationOptions}
          selected={locations}
          onToggle={(v) =>
            setLocations((prev) =>
              prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
            )
          }
        />

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="bg-brand text-brand-foreground mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold disabled:opacity-60"
        >
          <Save className="size-4" />
          {save.isPending ? "Saving…" : "Save changes"}
        </button>
      </Card>

      <Card title="Password">
        {isGoogleAccount ? (
          <p className="text-muted-foreground text-sm">
            You sign in with Google, so there&apos;s no LS Services password to change. Manage your
            password in your Google account.
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:max-w-xs sm:flex-1">
              <TextField
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                type="password"
              />
            </div>
            <button
              onClick={() => changePassword.mutate()}
              disabled={changePassword.isPending}
              className="border-brand text-brand inline-flex items-center gap-2 rounded-lg border-2 px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              <KeyRound className="size-4" />
              Change password
            </button>
          </div>
        )}
      </Card>

      <Card title="Delete account">
        {confirmDelete ? (
          <div className="border-urgent/40 bg-urgent/5 rounded-xl border p-4">
            <p className="flex items-start gap-2 text-sm font-semibold">
              <AlertTriangle className="text-urgent mt-0.5 size-4 shrink-0" />
              This is permanent and cannot be undone.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Your profile, plan, billing history and every document request you&apos;ve made will be
              deleted immediately. You&apos;ll be signed out and would need to start over from
              scratch.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => removeAccount.mutate()}
                disabled={removeAccount.isPending}
                className="bg-urgent text-urgent-foreground rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-60"
              >
                {removeAccount.isPending ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="border-border rounded-lg border px-5 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-urgent border-urgent/40 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-bold"
          >
            <Trash2 className="size-4" />
            Delete account
          </button>
        )}
      </Card>
    </div>
  );
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border rounded-2xl border bg-card p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border focus:border-brand mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none"
      />
    </label>
  );
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mt-4" ref={ref}>
      <span className="text-xs font-semibold">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-border focus:border-brand mt-1 flex h-11 w-full items-center justify-between rounded-lg border bg-background px-3 text-sm outline-none"
      >
        <span className="truncate">
          {selected.length > 0
            ? `${selected.length} selected`
            : "Select options"}
        </span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-border mt-1 max-h-60 overflow-y-auto rounded-lg border bg-card p-2 shadow-sm">
          {options.length === 0 ? (
            <p className="text-muted-foreground p-2 text-sm">No options available.</p>
          ) : (
            options.map((option) => {
              const active = selected.includes(option);
              return (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onToggle(option)}
                    className="accent-brand size-4"
                  />
                  <span className="flex-1">{option}</span>
                  {active && <Check className="text-brand size-4" />}
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
