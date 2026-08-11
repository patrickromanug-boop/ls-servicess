export async function fetchTargetedJobs(
  preferredCategories: string[],
  preferredLocations: string[]
): Promise<JobRow[]> {
  if (preferredCategories.length === 0 && preferredLocations.length === 0) {
    return [];
  }

  // Step 1: resolve preferred category/location NAMES into their actual IDs
  const [categoryIdsResult, locationIdsResult] = await Promise.all([
    preferredCategories.length > 0
      ? supabase.from("categories").select("id").in("name", preferredCategories)
      : Promise.resolve({ data: [], error: null }),
    preferredLocations.length > 0
      ? supabase.from("locations").select("id").in("name", preferredLocations)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (categoryIdsResult.error) throw categoryIdsResult.error;
  if (locationIdsResult.error) throw locationIdsResult.error;

  const categoryIds = (categoryIdsResult.data ?? []).map((c: any) => c.id);
  const locationIds = (locationIdsResult.data ?? []).map((l: any) => l.id);

  if (categoryIds.length === 0 && locationIds.length === 0) {
    // Preferred names didn't match any real category/location rows
    return [];
  }

  const columns = `${BASE_COLUMNS},${APPLY_COLUMNS}`;

  // Step 2: filter jobs directly by category_id / location_id (real FK columns)
  // Using .or() so a job matches if EITHER its category OR its location fits
  const orFilters: string[] = [];
  if (categoryIds.length > 0) {
    orFilters.push(`category_id.in.(${categoryIds.join(",")})`);
  }
  if (locationIds.length > 0) {
    orFilters.push(`location_id.in.(${locationIds.join(",")})`);
  }

  let { data, error } = await supabase
    .from("jobs")
    .select(columns)
    .eq("status", "active")
    .or(orFilters.join(","))
    .order("created_at", { ascending: false })
    .limit(100);

  if (error?.code === "42703") {
    const { data: fbData, error: fbError } = await supabase
      .from("jobs")
      .select(BASE_COLUMNS)
      .eq("status", "active")
      .or(orFilters.join(","))
      .order("created_at", { ascending: false })
      .limit(100);
    if (fbError) throw fbError;
    return (fbData ?? []) as unknown as JobRow[];
  }

  if (error) throw error;
  return (data ?? []) as unknown as JobRow[];
}
