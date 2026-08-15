import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, ChevronDown, KeyRound, Save, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { deleteAccount, profileQueryOptions, updateProfile } from "@/lib/account";

export function ProfileSection({
  user,
  onSaved,
}: {
  user: User;
  onSaved?: () => void;
}) {
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
      // Trigger the callback to switch to Job Listing tab
      onSaved?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // rest of component unchanged...
}
