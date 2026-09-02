import { createFileRoute, notFound, useNavigate, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Suspense, useEffect } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { JobFeed } from "@/components/jobs/JobFeed";
import { JobDetail } from "@/components/jobs/JobDetail";
import { fetchJobById, idFromJobSlug, jobsQueryOptions } from "@/lib/jobs";

/**
 * "Popup that's really a page": each job has a real, crawlable URL
 * (/jobs/[slug]-[id]) with its own SSR <title>/meta. Navigating from a job
 * card sets router state so the page renders as an overlay on top of the job
 * list; a direct visit or shared link renders the standalone page.
 */
export const Route = createFileRoute("/jobs/$jobSlug")({
  loader: async ({ params, context }) => {
    const id = idFromJobSlug(params.jobSlug);
    if (!id) throw notFound();
    context.queryClient.ensureQueryData(jobsQueryOptions());
    const job = await fetchJobById(id);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Job unavailable — LS Services" }, { name: "robots", content: "noindex" }],
      };
    }
    const { job } = loaderData;
    const title = `${job.title} at ${job.organization} — LS Services`;
    const description = `${job.title} vacancy at ${job.organization}${
      job.locations?.name ? ` in ${job.locations.name}` : ""
    }. Deadline ${job.deadline}. See requirements and apply on the official site.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/jobs/${params.jobSlug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/jobs/${params.jobSlug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: job.title,
            description: job.purpose,
            hiringOrganization: { "@type": "Organization", name: job.organization },
            jobLocation: {
              "@type": "Place",
              address: { "@type": "PostalAddress", addressLocality: job.locations?.name ?? "Uganda", addressCountry: "UG" },
            },
            employmentType: job.job_types?.name ?? undefined,
            validThrough: job.deadline,
          }),
        },
      ],
    };
  },
  component: JobDetailRoute,
  notFoundComponent: JobNotFound,
});

function JobDetailRoute() {
  const { job } = Route.useLoaderData();
  const navigate = useNavigate();
  const asModal = useRouterState({
    select: (s) => Boolean((s.location.state as { jobModal?: boolean }).jobModal),
  });

  useEffect(() => {
    if (!asModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.history.back();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [asModal]);

  if (asModal) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10" aria-hidden>
          <Suspense fallback={null}>
            <JobFeed />
          </Suspense>
        </main>
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            aria-label="Close job details"
            onClick={() => window.history.back()}
            className="bg-ink/60 absolute inset-0"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-4 top-[10%] bottom-[10%] mx-auto max-h-[80vh] overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:max-w-lg"
          >
            <button
              onClick={() => window.history.back()}
              aria-label="Close"
              className="bg-muted absolute top-4 right-4 grid size-8 place-items-center rounded-full"
            >
              <X className="size-4" />
            </button>
            <JobDetail job={job} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <button
          onClick={() => navigate({ to: "/jobs" })}
          className="text-muted-foreground hover:text-brand mb-6 text-sm font-semibold"
        >
          ← All jobs
        </button>
        <JobDetail job={job} />
      </main>
      <Footer />
    </div>
  );
}

function JobNotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">This job is no longer available</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          The listing may have closed or been removed. Browse current openings instead.
        </p>
      </main>
      <Footer />
    </div>
  );
}
