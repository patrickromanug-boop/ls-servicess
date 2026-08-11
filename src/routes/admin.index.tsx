import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin portal — LS Services" },
      { name: "description", content: "LS Services internal administration portal." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin portal — LS Services" },
      { property: "og:description", content: "LS Services internal administration portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminIndex,
});

function AdminIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin/dashboard", replace: true });
  }, [navigate]);
  return <div className="min-h-screen bg-[#0E1738]" />;
}
