import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { JobForm, type JobFormValues } from "@/components/admin/JobForm";
import { createJob } from "@/lib/admin";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/post-job")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Post a job — LS Services admin" },
      { name: "description", content: "Publish a new job opening to the LS Services job feed." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Post a job — LS Services admin" },
      { property: "og:description", content: "Publish a new job opening." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PostJobPage,
});

function PostJobPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (values: JobFormValues) => createJob(values, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_jobs"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job published");
      navigate({ to: "/admin/jobs" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell title="Post a job" description="Published immediately with status “active”.">
      <div className="max-w-3xl">
        <JobForm
          submitLabel="Publish job"
          pending={mutation.isPending}
          onSubmit={(values) => mutation.mutate(values)}
        />
      </div>
    </AdminShell>
  );
}
