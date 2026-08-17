// ---- Targeted Jobs Panel (single button for both alerts) ----
function TargetedJobsPanel({
  userId,
  subscription,
  profile,
  onCompleteProfile,
  onEditProfile,
}: {
  userId: string;
  subscription: WebSubscription | null;
  profile: any;
  onCompleteProfile: () => void;
  onEditProfile: () => void;
}) {
  const queryClient = useQueryClient();
  const [pendingChange, setPendingChange] = useState<{
    from: "dashboard" | "whatsapp" | "both";
    to: "both";
  } | null>(null);

  const currentDelivery = subscription?.alert_delivery ?? DEFAULT_DELIVERY;
  const [displayDelivery, setDisplayDelivery] = useState(currentDelivery);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    setDisplayDelivery(currentDelivery);
  }, [currentDelivery]);

  const phone = profile?.phone?.trim();
  const hasPreferences =
    (profile?.preferred_categories && profile.preferred_categories.length > 0) ||
    (profile?.preferred_locations && profile.preferred_locations.length > 0);
  const profileComplete = !!phone && hasPreferences;

  const isActive = displayDelivery === "both" && !pendingChange;
  const isPendingEnable = pendingChange?.to === "both";

  const handleEnableAlerts = async () => {
    if (!profileComplete) {
      // We keep the explanation prompt hidden, so we do nothing here.
      return;
    }

    // If already active, treat as cancel
    if (isActive) {
      await handleCancelAlerts();
      return;
    }

    const from = displayDelivery;
    setPendingChange({ from, to: "both" });
    setDisplayDelivery("both");
    setShowExplanation(false);

    try {
      const updatedSubscription = await updateAlertDelivery("both");
      queryClient.setQueryData(subscriptionQueryOptions().queryKey, updatedSubscription);
      await queryClient.invalidateQueries({ queryKey: subscriptionQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: ["targeted-jobs", userId] });
      setPendingChange(null); // clear pending state so button becomes active
    } catch (err) {
      console.error(err);
      toast.error("Alerts could not be enabled. Please try again.");
      setDisplayDelivery(from);
      setPendingChange(null);
    }
  };

  const handleCancelAlerts = async () => {
    // Revert to the default, which does not prioritise targeted jobs
    const revertTo = DEFAULT_DELIVERY;
    setDisplayDelivery(revertTo);
    setPendingChange(null);
    setShowExplanation(true);

    try {
      const updatedSubscription = await updateAlertDelivery(revertTo);
      queryClient.setQueryData(subscriptionQueryOptions().queryKey, updatedSubscription);
      await queryClient.invalidateQueries({ queryKey: subscriptionQueryOptions().queryKey });
      queryClient.removeQueries({ queryKey: ["targeted-jobs", userId] });
    } catch (err) {
      console.error(err);
      toast.error("Alerts could not be cancelled. Please try again.");
      setDisplayDelivery("both");
      setShowExplanation(false);
    }
  };

  // This prompt is kept for future use but is intentionally not rendered.
  const profilePrompt = (
    <div className="mt-4 rounded-xl border border-brand/20 bg-brand/[0.03] p-4">
      <p className="text-sm font-semibold">How job alerts work</p>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        Add your job preferences first. Matching jobs will appear in your
        dashboard, with links also sent through{" "}
        <strong className="font-bold text-foreground">WhatsApp</strong>.
      </p>
      <button
        onClick={onCompleteProfile}
        className="mt-3 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white"
      >
        Try it out
      </button>
    </div>
  );

  return (
    <div className="border-border rounded-2xl border bg-white p-5">
      <h3 className="font-display text-sm font-bold">Job alert delivery</h3>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        See matched roles on your dashboard and get them through{" "}
        <strong className="font-bold text-foreground">WhatsApp</strong> as well.
      </p>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleEnableAlerts}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
            isActive
              ? "bg-muted text-foreground hover:bg-muted/80"
              : "bg-brand text-brand-foreground hover:bg-brand/90"
          }`}
        >
          {isActive
            ? "Dashboard + WhatsApp alerts active — click to cancel"
            : "Enable Dashboard + WhatsApp alerts"}
        </button>
      </div>

      {/* The prompt is hidden but not removed. */}
      {false && profilePrompt}

      {isPendingEnable && !showExplanation && (
        <div className="mt-4 rounded-xl border border-brand/20 bg-brand/[0.03] p-4">
          <p className="text-xs font-medium">Dashboard + WhatsApp alerts are being enabled.</p>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {profile?.full_name && <p>Name: {profile.full_name}</p>}
            {phone && <p>Phone: {phone}</p>}
            {profile?.preferred_categories?.length > 0 && (
              <p>Categories: {profile.preferred_categories.join(", ")}</p>
            )}
            {profile?.preferred_locations?.length > 0 && (
              <p>Locations: {profile.preferred_locations.join(", ")}</p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCancelAlerts}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onEditProfile}
              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-500"
            >
              Edit Info
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Cancel restores your previous alert preference.
          </p>
        </div>
      )}
    </div>
  );
}
