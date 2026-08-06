import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { JobFeed } from "@/components/jobs/JobFeed";
import { jobsQueryOptions } from "@/lib/jobs";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "Browse Jobs in Uganda — LS Services" },
      {
        name: "description",
        content:
          "Search and filter current job openings in Uganda by category, location and job type. Updated daily by LS Services.",
      },
      { property: "og:title", content: "Browse Jobs in Uganda — LS Services" },
      {
        property: "og:description",
        content: "Search and filter current job openings in Uganda by category, location and job type.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/jobs" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(jobsQueryOptions());
  },
  component: JobsPage,
});

function JobsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold">Find work in Uganda</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Browse every open listing. No account needed to look around.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-muted-foreground text-sm">Loading jobs…</p>}>
            <JobFeed />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
